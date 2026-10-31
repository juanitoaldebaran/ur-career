package practice

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

var ErrQuizGeneration = errors.New("could not generate quiz")

type QuizReviewItem struct {
	QuestionID  uuid.UUID `json:"question_id"`
	Selected    *int      `json:"selected"`
	Correct     int       `json:"correct"`
	IsCorrect   bool      `json:"is_correct"`
	Explanation string    `json:"explanation"`
}

type QuizResult struct {
	Score   int              `json:"score"`
	Correct int              `json:"correct"`
	Total   int              `json:"total"`
	Review  []QuizReviewItem `json:"review"`
}

type QuizService struct {
	repo QuizRepository
	gen  QuizGenerator
}

func NewQuizService(repo QuizRepository, gen QuizGenerator) *QuizService {
	return &QuizService{
		repo: repo,
		gen:  gen,
	}
}

func (s *QuizService) Create(ctx context.Context, userID uuid.UUID, role string) (*QuizSession, error) {
	title, topics, err := s.repo.RoleInfo(ctx, role, quizTopics)
	if err != nil {
		return nil, err
	}

	if len(topics) == 0 {
		topics = []string{title}
	}

	avoid, err := s.repo.RecentPrompts(ctx, userID, role, quizRecentN)
	if err != nil {
		return nil, err
	}

	generatedQuiz, err := s.gen.Generate(ctx, title, topics, avoid)
	if err != nil {
		return nil, ErrQuizGeneration
	}

	questions := cleanQuestions(generatedQuiz)
	if len(questions) < quizSize {
		return nil, ErrQuizGeneration
	}

	return s.repo.CreateQuiz(ctx, userID, role, questions)
}

func (s *QuizService) Submit(ctx context.Context, userID, quizID uuid.UUID, answers map[string]int) (*QuizResult, error) {
	storedQuestions, err := s.repo.LoadForGrading(ctx, quizID, userID)
	if err != nil {
		return nil, err
	}

	result := &QuizResult{
		Total:  len(storedQuestions),
		Review: make([]QuizReviewItem, 0, len(storedQuestions)),
	}
	clean := make(map[string]int, len(storedQuestions))

	for _, q := range storedQuestions {
		item := QuizReviewItem{
			QuestionID:  q.ID,
			Correct:     q.CorrectIndex,
			Explanation: q.Explanation,
		}

		if sel, ok := answers[q.ID.String()]; ok && sel >= 0 && sel <= 3 {
			item.Selected = &sel
			item.IsCorrect = sel == q.CorrectIndex
			clean[q.ID.String()] = sel
		}

		if item.IsCorrect {
			result.Correct++
		}
		result.Review = append(result.Review, item)
	}

	if result.Total > 0 {
		result.Score = result.Correct * 100 / result.Total
	}

	if err := s.repo.SaveResult(ctx, quizID, clean, result.Score); err != nil {
		return nil, err
	}

	return result, nil
}
