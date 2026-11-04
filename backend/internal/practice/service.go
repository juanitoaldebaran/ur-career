package practice

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
)

var (
	ErrAnswerTooShort = errors.New("answers must be at least 20 characters")
)

type Result struct {
	AttemptID       uuid.UUID        `json:"attempt_id"`
	Score           int              `json:"score"`
	Feedback        string           `json:"feedback"`
	Criteria        []CriterionScore `json:"criteria"`
	ReferenceAnswer string           `json:"reference_answer"`
}

type Service struct {
	repo   Repository
	grader Grader
}

func NewService(repo Repository, grader Grader) *Service {
	return &Service{
		repo:   repo,
		grader: grader,
	}
}

func (s *Service) ListQuestion(ctx context.Context, userID uuid.UUID, role string) ([]QuestionSummary, error) {
	return s.repo.ListQuestion(ctx, userID, role)
}

func normalize(rubric []Criterion, grade *Grade) ([]CriterionScore, int) {
	if grade == nil {
		grade = &Grade{}
	}

	indexCriteria := make(map[string]CriterionScore, len(grade.Criteria))
	for _, item := range grade.Criteria {
		key := strings.ToLower(strings.TrimSpace(item.Name))
		indexCriteria[key] = item
	}

	results := make([]CriterionScore, 0, len(rubric))
	earned, possible := 0, 0
	for _, line := range rubric {
		key := strings.ToLower(strings.TrimSpace(line.Name))
		found := indexCriteria[key]

		score := min(max(found.Score, 0), line.Max)

		results = append(results, CriterionScore{
			Name:    line.Name,
			Score:   score,
			Max:     line.Max,
			Comment: found.Comment,
		})
		earned += score
		possible += line.Max
	}

	if possible == 0 {
		return results, 0
	}

	return results, earned * 100 / possible
}
