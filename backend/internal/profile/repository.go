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

func (r *PgxRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*Profile, error) {
	const query = `
	SELECT user_id, current_role, target_role, updated_at
	FROM profiles
	WHERE user_id = $1
	`

	var profile Profile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&profile.UserID,
		&profile.CurrentRole,
		&profile.TargetRole,
		&profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	return &profile, nil
}

func (r *PgxRepository) ListSkills(ctx context.Context, profileID uuid.UUID) ([]Skills, error) {
	const query = `
	SELECT id, name, proficiency
	FROM skills
	WHERE profile_id = $1
	ORDER BY name
	`

	rows, err := r.db.Query(ctx, query, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	skills := make([]Skills, 0)
	for rows.Next() {
		var skill Skills
		if err := rows.Scan(&skill.ID, &skill.Name, &skill.Proficiency); err != nil {
			return nil, err
		}
		skills = append(skills, skill)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return skills, nil
}

func (r *PgxRepository) UpsertProfile(ctx context.Context, userID uuid.UUID, currentRole, targetRole string, constraints []byte) (*Profile, error) {
	const query = `
	INSERT INTO profiles (user_id, current_role, target_role, constraints)
	VALUES ($1, $2, $3, $4)
	ON CONFLICT (user_id) DO UPDATE
	SET current_role = EXCLUDED.current_role,
	    target_role = EXCLUDED.target_role,
	    constraints = EXCLUDED.constraints,
	    updated_at = now()
	RETURNING user_id, current_role, target_role, updated_at
	`

	var profile Profile
	err := r.db.QueryRow(ctx, query, userID, currentRole, targetRole, constraints).Scan(
		&profile.UserID,
		&profile.CurrentRole,
		&profile.TargetRole,
		&profile.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}
