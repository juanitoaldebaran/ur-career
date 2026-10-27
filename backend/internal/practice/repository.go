package practice

import "github.com/google/uuid"

type Criterion struct {
	Name        string `json:"name"`
	Max         int    `json:"max"`
	Description string `json:"description"`
}

type Question struct {
	ID              uuid.UUID
	Category        string
	Difficulty      string
	Prompt          string
	Approach        string
	Evaluating      string
	ReferenceAnswer string
	Rubric          []Criterion
}
