package profile

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrProfileNotFound = errors.New("error user not found")
)

type Profile struct {
	UserID      uuid.UUID `json:"user_id"`
	CurrentRole string    `json:"current_role"`
	TargetRole  string    `json:"target_role"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PgxRepository struct {
	db *pgxpool.Pool
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) GetProfileByUserID(ctx context.Context, userId string) (*Profile, error) {
	const query = `
	SELECT id, current_role, target_role 
	FROM profile
	WHERE user_id = $1
	`

	var profile Profile
	err := r.db.QueryRow(ctx, query, userId).Scan(
		&profile.UserID,
		&profile.CurrentRole,
		&profile.TargetRole,
		&profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
	}

	return &profile, nil
}
