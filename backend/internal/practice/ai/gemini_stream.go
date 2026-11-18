zpackage ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Turn struct {
	Role string // "user" or "assistant"
	Text string
}

type Usage struct {
	PromptTokens     int
	CompletionTokens int
}

type Chunk struct {
	Text  string
	Usage *Usage
	Err   error
}

const maxOutputTokens = 1024

// Retries only happen BEFORE the first byte. The channel is always closed, and the
// goroutine exits if ctx is cancelled (client disconnected).
func (g *Gemini) Stream(ctx context.Context, system string, turns []Turn) (<-chan Chunk, error) {
	contents := make([]map[string]any, 0, len(turns))
	for _, t := range turns {
		role := "user"
		if t.Role == "assistant" {
			role = "model" // Gemini's name for the assistant
		}
		contents = append(contents, map[string]any{
			"role":  role,
			"parts": []map[string]string{{"text": t.Text}},
		})
	}

	body, err := json.Marshal(map[string]any{
		"systemInstruction": map[string]any{"parts": []map[string]string{{"text": system}}},
		"contents":          contents,
		"generationConfig": map[string]any{
			"temperature":     0.6,
			"maxOutputTokens": maxOutputTokens,
		},
	})
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse", g.model)

	var resp *http.Response
	for attempt := 0; attempt < maxAttempt; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
		if err != nil {
			return nil, err
		}
		req.Header.Set("x-goog-api-key", g.apiKey)
		req.Header.Set("Content-Type", "application/json")

		resp, err = g.stream.Do(req)
		if err != nil {
			return nil, err
		}

		retryable := resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests
		if !retryable || attempt == maxAttempt-1 {
			break
		}
		resp.Body.Close()
		select {
		case <-time.After(time.Duration(attempt+1) * time.Second):
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("gemini status %d", resp.StatusCode)
	}

	out := make(chan Chunk, 16)
	go func() {
		defer close(out)
		defer resp.Body.Close()

		send := func(c Chunk) bool {
			select {
			case out <- c:
				return true
			case <-ctx.Done():
				return false
			}
		}

		var usage *Usage
		sawText := false

		scanner := bufio.NewScanner(resp.Body)
		scanner.Buffer(make([]byte, 0, 64*1024), 1<<20)
		for scanner.Scan() {
			line := scanner.Text()
			if !strings.HasPrefix(line, "data:") {
				continue
			}
			payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
			if payload == "" {
				continue
			}

			var ev struct {
				Candidates []struct {
					Content struct {
						Parts []struct {
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"content"`
				} `json:"candidates"`
				UsageMetadata *struct {
					PromptTokenCount     int `json:"promptTokenCount"`
					CandidatesTokenCount int `json:"candidatesTokenCount"`
				} `json:"usageMetadata"`
			}
			if err := json.Unmarshal([]byte(payload), &ev); err != nil {
				send(Chunk{Err: fmt.Errorf("decode gemini chunk: %w", err)})
				return
			}

			if ev.UsageMetadata != nil {
				usage = &Usage{
					PromptTokens:     ev.UsageMetadata.PromptTokenCount,
					CompletionTokens: ev.UsageMetadata.CandidatesTokenCount,
				}
			}
			for _, c := range ev.Candidates {
				for _, p := range c.Content.Parts {
					if p.Text == "" {
						continue
					}
					sawText = true
					if !send(Chunk{Text: p.Text}) {
						return
					}
				}
			}
		}

		if err := scanner.Err(); err != nil && ctx.Err() == nil {
			send(Chunk{Err: err})
			return
		}
		if ctx.Err() != nil {
			return
		}
		if !sawText {
			send(Chunk{Err: errors.New("gemini returned no content")})
			return
		}
		if usage != nil {
			send(Chunk{Usage: usage})
		}
	}()

	return out, nil
}

func (g *Gemini) Model() string { return g.model }
