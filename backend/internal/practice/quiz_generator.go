package practice

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"strings"

	"github.com/juanitoaldebaran/ur-career-backend/internal/practice/ai"
)

const (
	quizSize    = 15
	quizOverAsk = 18
	quizTopics  = 8
	quizRecentN = 45
)

type GeminiQuizGenerator struct {
	g *ai.Gemini
}

type QuizGenerator interface {
	Generate(ctx context.Context, roleTitle string, topics, avoid []string) ([]GeneratedQuestion, error)
}

func NewGeminiQuizGenerator(g *ai.Gemini) *GeminiQuizGenerator {
	return &GeminiQuizGenerator{
		g: g,
	}
}

const quizSystem = `You write multiple-choice interview quiz questions that test practical knowledge for a specific job role.
Rules: exactly 4 options per question; exactly one is correct; wrong options must be plausible, not silly;
mix easy, medium and hard; test understanding, not trivia; keep each question under 40 words;
the explanation says why the correct answer is right in 1-2 sentences.`

var quizSchema = map[string]any{
	"type": "OBJECT",
	"properties": map[string]any{
		"questions": map[string]any{"type": "ARRAY", "items": map[string]any{
			"type": "OBJECT",
			"properties": map[string]any{
				"prompt":        map[string]any{"type": "STRING"},
				"options":       map[string]any{"type": "ARRAY", "items": map[string]any{"type": "STRING"}},
				"correct_index": map[string]any{"type": "INTEGER"},
				"explanation":   map[string]any{"type": "STRING"},
			},
			"required": []string{"prompt", "options", "correct_index", "explanation"},
		}},
	},
	"required": []string{"questions"},
}

func (q *GeminiQuizGenerator) Generate(ctx context.Context, roleTitle string, topics, avoid []string) ([]GeneratedQuestion, error) {
	user := fmt.Sprintf("Role: %s\nWrite %d questions. Spread them across these topics: %s.",
		roleTitle, quizOverAsk, strings.Join(topics, "; "))
	if len(avoid) > 0 {
		user += "\nThe candidate has already seen these, so do not repeat or paraphrase them:\n- " + strings.Join(avoid, "\n- ")
	}

	raw, err := q.g.GenerateJSON(ctx, quizSystem, user, quizSchema, 1.0)
	if err != nil {
		return nil, err
	}

	var out struct {
		Questions []GeneratedQuestion `json:"questions"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}

	return out.Questions, nil
}

func cleanQuestions(in []GeneratedQuestion) []GeneratedQuestion {
	seen := make(map[string]bool)
	out := make([]GeneratedQuestion, 0, quizSize)
	for _, q := range in {
		q.Prompt = strings.TrimSpace(q.Prompt)
		key := strings.ToLower(q.Prompt)
		if !validQuestion(q) || seen[key] {
			continue
		}

		seen[key] = true
		shuffleQuestions(&q)
		out = append(out, q)
		if len(out) == quizSize {
			break
		}
	}

	return out
}

func validQuestion(q GeneratedQuestion) bool {
	if len(q.Options) != 4 || q.Prompt == "" || q.CorrectIndex < 0 || q.CorrectIndex > 3 {
		return false
	}

	opts := make(map[string]bool)
	for _, o := range q.Options {
		o = strings.TrimSpace(o)
		if o == "" || opts[o] {
			return false
		}
		opts[o] = true
	}

	return true
}

func shuffleQuestions(q *GeneratedQuestion) {
	correct := q.Options[q.CorrectIndex]
	rand.Shuffle(len(q.Options), func(i, j int) {
		q.Options[i], q.Options[j] = q.Options[j], q.Options[i]
	})

	for i, o := range q.Options {
		if o == correct {
			q.CorrectIndex = i
			return
		}
	}
}
