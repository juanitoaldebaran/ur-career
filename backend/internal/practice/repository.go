package practice

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrQuestionsNotFound = errors.New("question not found")
)

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

type Criterion struct {
	Name        string `json:"name"`
	Max         int    `json:"max"`
	Description string `json:"description"`
}

type QuestionSummary struct {
	ID         uuid.UUID `json:"id"`
	Category   string    `json:"category"`
	Difficulty string    `json:"difficulty"`
	Prompt     string    `json:"prompt"`
	Approach   string    `json:"approach"`
	Evaluating string    `json:"evaluating"`
	BestScore  *int      `json:"best_score"`
}

type Attempt struct {
	UserID     uuid.UUID
	QuestionID uuid.UUID
	Answer     string
	Score      int
	Feedback   string
	Criteria   []CriterionScore
}

type Repository interface {
	ListQuestion(ctx context.Context, userID uuid.UUID, role string) ([]QuestionSummary, error)
	GetQuestion(ctx context.Context, id uuid.UUID) (*Question, error)
	SaveAttempt(ctx context.Context, attempt Attempt) (uuid.UUID, error)
}

type PgxRepository struct {
	db *pgxpool.Pool
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) ListQuestion(ctx context.Context, userID uuid.UUID, role string) ([]QuestionSummary, error) {
	query := `
	SELECT q.id, q.category, q.difficulty, q.prompt, q.approach, q.evaluating, MAX(a.score)
	FROM practice_questions q
	LEFT JOIN practice_attempts a ON a.question_id = q.id AND a.user_id = $1
	WHERE q.role_slug = $2
	GROUP BY q.id
	ORDER BY q.category, q.position
	`

	rows, err := r.db.Query(ctx, query, userID, role)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	questions := make([]QuestionSummary, 0)
	for rows.Next() {
		var question QuestionSummary
		if err := rows.Scan(
			&question.ID,
			&question.Category,
			&question.Difficulty,
			&question.Prompt,
			&question.Approach,
			&question.Evaluating,
			&question.BestScore,
		); err != nil {
			return nil, err
		}
		questions = append(questions, question)
	}

	return questions, rows.Err()
}

func (r *PgxRepository) GetQuestion(ctx context.Context, id uuid.UUID) (*Question, error) {
	query := `SELECT id, category, difficulty, prompt, approach, evaluating, reference_answer, rubric
	FROM practice_questions
	WHERE id = $1
	`

	var question Question
	var rubric []byte
	err := r.db.QueryRow(ctx, query, id).Scan(
		&question.ID,
		&question.Category,
		&question.Difficulty,
		&question.Prompt,
		&question.Approach,
		&question.Evaluating,
		&question.ReferenceAnswer,
		&rubric,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrQuestionsNotFound
	}

	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(rubric, &question.Rubric); err != nil {
		return nil, err
	}

	return &question, nil
}

func (r *PgxRepository) SaveAttempt(ctx context.Context, attempt Attempt) (uuid.UUID, error) {
	criteria, err := json.Marshal(attempt.Criteria)
	if err != nil {
		return uuid.Nil, err
	}

	query := `
	INSERT INTO practice_attempts (user_id, question_id, answer, score, feedback, criteria)
	VALUES ($1, $2, $3, $4, $5, $6)
	RETURNING id
	`

	var id uuid.UUID
	if err := r.db.QueryRow(ctx, query,
		attempt.UserID,
		attempt.QuestionID,
		attempt.Answer,
		attempt.Score,
		attempt.Feedback,
		criteria,
	).Scan(&id); err != nil {
		return uuid.Nil, err
	}

	return id, nil
}
