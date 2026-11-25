package cvreview

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("review not found")

type Review struct {
	ID         uuid.UUID   `json:"id"`
	TargetRole string      `json:"target_role"`
	Score      int         `json:"score"`
	Summary    string      `json:"summary"`
	Criteria   []Criterion `json:"criteria"`
	CreatedAt  time.Time   `json:"created_at"`
}

type Repository interface {
	Find(ctx context.Context, userID uuid.UUID, hash, role string) (*Review, error)
	Save(ctx context.Context, userID uuid.UUID, hash, model string, r *Review) (*Review, error)
}

const columns = `id, target_role, score, summary, criteria, created_at`

type PgxRepository struct{ db *pgxpool.Pool }

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository { return &PgxRepository{db: db} }

func scanReview(row pgx.Row) (*Review, error) {
	var r Review
	var criteria []byte
	err := row.Scan(&r.ID, &r.TargetRole, &r.Score, &r.Summary, &criteria, &r.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}

	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(criteria, &r.Criteria); err != nil {
		return nil, err
	}

	return &r, nil
}

func (p *PgxRepository) Save(ctx context.Context, userID uuid.UUID, hash, model string, r *Review) (*Review, error) {
	criteria, err := json.Marshal(r.Criteria)
	if err != nil {
		return nil, err
	}

	return scanReview(p.db.QueryRow(ctx,
		`INSERT INTO cv_reviews (user_id, file_sha256, target_role, score, summary, criteria, model)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (user_id, file_sha256, target_role)
		 DO UPDATE SET score = cv_reviews.score
		 RETURNING `+columns,
		userID, hash, r.TargetRole, r.Score, r.Summary, string(criteria), model))
}

func (p *PgxRepository) Find(ctx context.Context, userID uuid.UUID, hash, role string) (*Review, error) {
	return scanReview(p.db.QueryRow(ctx,
		`SELECT `+columns+` FROM cv_reviews
		WHERE user_id = $1 AND file_sha256 = $2 AND target_role = $3
		`, userID, hash, role))
}
