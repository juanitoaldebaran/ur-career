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
	ErrSkillsNotFound  = errors.New("error skill not found")
)

type Profile struct {
	UserID      uuid.UUID `json:"user_id"`
	CurrentRole string    `json:"current_role"`
	TargetRole  string    `json:"target_role"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Skills struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Proficiency string    `json:"proficiency"`
}

type PgxRepository struct {
	db *pgxpool.Pool
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) GetProfileByUserID(ctx context.Context, userId uuid.UUID) (*Profile, error) {
	const query = `
	SELECT id, current_role, target_role, updated_at
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

func (r *PgxRepository) ListSkills(ctx context.Context, profileId uuid.UUID) (*Skills, error) {
	const query = `
	SELECT id, name, proficiency
	FROM skills
	WHERE profile_id = $1
	`

	var skills Skills
	err := r.db.QueryRow(ctx, query, profileId).Scan(
		&skills.ID,
		&skills.Name,
		&skills.Proficiency,
	)

	if err != nil {
		if errors.Is(err, ErrSkillsNotFound) {
			return nil, ErrSkillsNotFound
		}
	}

	return &skills, nil
}
