package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const maxAttempt = 3

type Gemini struct {
	apiKey string
	model  string
	client *http.Client
}

func NewGemini(apiKey string, model string) *Gemini {
	return &Gemini{
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

func (g *Gemini) GenerateJSON(ctx context.Context, system, user string, schema map[string]any, temperature float64) ([]byte, error) {
	body, err := json.Marshal(map[string]any{
		"systemInstruction": map[string]any{"parts": []map[string]string{{"text": system}}},
		"contents":          []map[string]any{{"role": "user", "parts": []map[string]string{{"text": user}}}},
		"generationConfig": map[string]any{
			"responseMimeType": "application/json",
			"responseSchema":   schema,
			"temperature":      temperature,
		},
	})

	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", g.model)
	var resp *http.Response
	for attempt := 0; attempt < maxAttempt; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
		if err != nil {
			return nil, err
		}

		req.Header.Set("x-goog-api-key", g.apiKey)
		req.Header.Set("Content-Type", "application/json")

		resp, err = g.client.Do(req)
		if err != nil {
			return nil, err
		}

		retryable := resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests
		if !retryable || attempt == maxAttempt-1 {
			break
		}

		resp.Body.Close()
		select {
		case <-time.After(time.Duration(attempt+1) * 2 * time.Second):
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gemini status %d", resp.StatusCode)
	}

	var out struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini returned no content")
	}

	return []byte(out.Candidates[0].Content.Parts[0].Text), nil
}
