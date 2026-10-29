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

type QuizQuestions struct {
	ID      uuid.UUID `json:"id"`
	Prompt  string    `json:"prompt"`
	Options []string  `json:"options"`
}

type QuizSession struct {
	ID        uuid.UUID       `json:"id"`
	Role      string          `json:"role"`
	Questions []QuizQuestions `json:"question"`
}

type storedQuestion struct {
	ID           uuid.UUID
	CorrectIndex int
	Explanation  string
}

type PgxQuizRepository struct {
	db *pgxpool.Pool
}

type QuizRepository interface {
	RoleInfo(ctx context.Context, role string, topicCount int) (title string, topics []string, err error)
	RecentPrompts(ctx context.Context, userID uuid.UUID, role string, limit int) ([]string, error)
	CreateQuiz(ctx context.Context, userID uuid.UUID, role string, qs []GeneratedQuestion) (*QuizSession, error)
	LoadForGrading(ctx context.Context, quizID, userID uuid.UUID) ([]storedQuestion, error)
	SaveResult(ctx context.Context, quizID uuid.UUID, answers map[string]int, score int) error
}

func NewPgxQuizRepository(db *pgxpool.Pool) *PgxQuizRepository {
	return &PgxQuizRepository{
		db: db,
	}
}

func (r *PgxQuizRepository) RoleInfo(ctx context.Context, role string, topicCount int) (string, []string, error) {
	var title string
	query := `SELECT title FROM roadmaps WHERE slug = $1`
	err := r.db.QueryRow(ctx, query, role).Scan(&title)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil, ErrRoleNotFound
	}

	if err != nil {
		return "", nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT n.title FROM roadmap_nodes n 
		JOIN roadmaps m ON m.id = n.roadmap_id
		WHERE slug = $1
		ORDER BY random() LIMIT $2
	`, role, topicCount)

	if err != nil {
		return "", nil, err
	}

	defer rows.Close()

	var topics []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return "", nil, err
		}
		topics = append(topics, t)
	}

	return title, topics, nil
}

func (r *PgxQuizRepository) RecentPrompts(ctx context.Context, userID uuid.UUID, role string, limit int) ([]string, error) {
	rows, err := r.db.Query(ctx, `
		SELECT qq.prompt FROM quiz_questions qq
		JOIN quizzes z ON qq.quiz_id = z.id
		WHERE z.user_id = $1 AND z.role_slug = $2
		ORDER BY z.created_at DESC LIMIT $3
	`, userID, role, limit)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var prompts []string
	for rows.Next() {
		var prompt string
		if err := rows.Scan(&prompt); err != nil {
			return nil, err
		}
		prompts = append(prompts, prompt)
	}

	return prompts, nil
}

func (r *PgxQuizRepository) CreateQuiz(ctx context.Context, userID uuid.UUID, role string, qs []GeneratedQuestion) (*QuizSession, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}

	defer tx.Rollback(ctx)
	session := &QuizSession{
		Role: role,
	}

	if err := tx.QueryRow(ctx, `INSERT INTO quizzes (user_id, role_slug) VALUES ($1, $2) RETURNING id`, userID, role).Scan(&session.ID); err != nil {
		return nil, err
	}

	for i, q := range qs {
		opts, err := json.Marshal(q.Options)
		if err != nil {
			return nil, err
		}
		var id uuid.UUID
		if err := tx.QueryRow(ctx, `
			INSERT INTO quiz_questions (quiz_id, position, prompt, options, correct_index, explanation)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
			session.ID, i, q.Prompt, opts, q.CorrectIndex, q.Explanation,
		).Scan(&id); err != nil {
			return nil, err
		}
		session.Questions = append(session.Questions, QuizQuestions{ID: id, Prompt: q.Prompt, Options: q.Options})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return session, nil
}

func (r *PgxQuizRepository) LoadForGrading(ctx context.Context, quizID, userID uuid.UUID) ([]storedQuestion, error) {
	var submitted bool
	err := r.db.QueryRow(ctx,
		`SELECT submitted_at IS NOT NULL 
	 FROM quizzes 
	 WHERE id = $1 AND user_id = $2
	 `, quizID, userID,
	).Scan(&submitted)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrQuizNotFound
	}

	if err != nil {
		return nil, err
	}

	if submitted {
		return nil, ErrQuizSubmitted
	}

	rows, err := r.db.Query(ctx, `
	SELECT id, correct_index, explanation FROM quiz_questions WHERE quiz_id = $1 ORDER BY position
	`, quizID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var out []storedQuestion
	for rows.Next() {
		var q storedQuestion
		if err := rows.Scan(&q); err != nil {
			return nil, err
		}
		out = append(out, q)
	}

	return out, nil
}

func (r *PgxQuizRepository) SaveResult(ctx context.Context, quizID uuid.UUID, answers map[string]int, score int) error {
	raw, err := json.Marshal(answers)
	if err != nil {
		return err
	}

	tag, err := r.db.Exec(ctx, `UPDATE quizzes SET score = $2, answers = $3, submitted_at = now() WHERE id = $1 AND submitted_at IS NULL`, quizID, score, raw)
	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrQuizSubmitted
	}

	return nil
}
