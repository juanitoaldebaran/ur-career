package practice

import "context"

type CriterionScore struct {
	Name    string `json:"name"`
	Score   int    `json:"score"`
	Max     int    `json:"max"`
	Comment string `json:"comment"`
}

type Grade struct {
	Feedback string           `json:"feedback"`
	Criteria []CriterionScore `json:"criteria"`
}

type Grader interface {
	Grade(ctx context.Context, q *Question, answer string) (*Grade, error)
}
