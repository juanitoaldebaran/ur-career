package practice

import (
	"context"
	"errors"
	"log"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
)

const (
	minAnswerLen = 20
	maxAnswerLen = 8000
)

var (
	ErrAnswerTooShort = errors.New("answer must be at least 20 characters")
	ErrAnswerTooLong  = errors.New("answer must be at most 8000 characters")
	ErrGradingFailed  = errors.New("could not grade answer")
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

func (s *Service) Submit(ctx context.Context, userID uuid.UUID, questionID uuid.UUID, answer string) (*Result, error) {
	answer = strings.TrimSpace(answer)
	if err := validateAnswer(answer); err != nil {
		return nil, err
	}

	question, err := s.repo.GetQuestion(ctx, questionID)
	if err != nil {
		return nil, err
	}

	grade, err := s.grader.Grade(ctx, question, answer)
	if err != nil {
		log.Printf("practice grade: %v", err)
		return nil, ErrGradingFailed
	}

	criteria, score := normalize(question.Rubric, grade)

	attemptID, err := s.repo.SaveAttempt(ctx, Attempt{
		UserID:     userID,
		QuestionID: question.ID,
		Answer:     answer,
		Score:      score,
		Feedback:   grade.Feedback,
		Criteria:   criteria,
	})
	if err != nil {
		return nil, err
	}

	return &Result{
		AttemptID:       attemptID,
		Score:           score,
		Feedback:        grade.Feedback,
		Criteria:        criteria,
		ReferenceAnswer: question.ReferenceAnswer,
	}, nil
}

func validateAnswer(answer string) error {
	length := utf8.RuneCountInString(answer)

	if length < minAnswerLen {
		return ErrAnswerTooShort
	}

	if length > maxAnswerLen {
		return ErrAnswerTooLong
	}

	return nil
}
