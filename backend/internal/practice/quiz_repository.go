package practice

import (
	"errors"

	"github.com/google/uuid"
)

var (
	ErrRoleNotFound  = errors.New("role not found")
	ErrQuizNotFound  = errors.New("quiz not found")
	ErrQuizSubmitted = errors.New("quiz already submitted")
)

type GeneratedQuestion struct {
	Prompt       string   `json:"prompt"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
	Explanation  string   `json:"explanation"`
}

type QuizQuestion struct {
	ID      uuid.UUID `json:"id"`
	Prompt  string    `json:"prompt"`
	Options []string  `json:"options"`
}

type QuizSession struct {
	ID       uuid.UUID      `json:"id"`
	Role     string         `json:"role"`
	Question []QuizQuestion `json:"question"`
}

type storedQuestion struct {
	ID           uuid.UUID
	CorrectIndex int
	Explanation  string
}
