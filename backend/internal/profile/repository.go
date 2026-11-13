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
	FullName    string    `json:"full_name"`
	CurrentRole string    `json:"current_job_role"`
	TargetRole  string    `json:"target_role"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Skills struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Proficiency string    `json:"proficiency"`
}

type RoadmapProgress struct {
	Slug       string `json:"slug"`
	Title      string `json:"title"`
	TotalNodes int    `json:"total_nodes"`
	DoneNodes  int    `json:"done_nodes"`
}

type QuizStats struct {
	TotalTaken   int `json:"total_taken"`
	BestScore    int `json:"best_score"`
	AverageScore int `json:"average_score"`
}

type PracticeStats struct {
	TotalAttempts int `json:"total_attempts"`
	BestScore     int `json:"best_score"`
	AverageScore  int `json:"average_score"`
}

type PgxRepository struct {
	db *pgxpool.Pool
}

type Repository interface {
	GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*Profile, error)
	ListSkills(ctx context.Context, profileID uuid.UUID) ([]Skills, error)
	UpsertProfile(ctx context.Context, userID uuid.UUID, fullName, currentRole, targetRole string, constraints []byte) (*Profile, error)
	ListRoadmapProgress(ctx context.Context, userID uuid.UUID) ([]RoadmapProgress, error)
	GetQuizStats(ctx context.Context, userID uuid.UUID) (QuizStats, error)
	GetPracticeStats(ctx context.Context, userID uuid.UUID) (PracticeStats, error)
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*Profile, error) {
	const query = `
	SELECT user_id, full_name, COALESCE(current_job_role, ''), COALESCE(target_role, ''), updated_at
	FROM profiles
	WHERE user_id = $1
	`

	var profile Profile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&profile.UserID,
		&profile.FullName,
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

	return skills, nil
}

func (r *PgxRepository) UpsertProfile(ctx context.Context, userID uuid.UUID, fullName, currentRole, targetRole string, constraints []byte) (*Profile, error) {
	// A JSON null means "constraints not provided": keep what is stored.
	const query = `
	INSERT INTO profiles (user_id, full_name, current_job_role, target_role, constraints)
	VALUES ($1, $2, $3, $4, COALESCE(NULLIF($5::jsonb, 'null'::jsonb), '{}'::jsonb))
	ON CONFLICT (user_id) DO UPDATE
	SET full_name = EXCLUDED.full_name,
	    current_job_role = EXCLUDED.current_job_role,
	    target_role = EXCLUDED.target_role,
	    constraints = COALESCE(NULLIF($5::jsonb, 'null'::jsonb), profiles.constraints),
	    updated_at = now()
	RETURNING user_id, full_name, COALESCE(current_job_role, ''), COALESCE(target_role, ''), updated_at
	`

	var profile Profile
	err := r.db.QueryRow(ctx, query, userID, fullName, currentRole, targetRole, constraints).Scan(
		&profile.UserID,
		&profile.FullName,
		&profile.CurrentRole,
		&profile.TargetRole,
		&profile.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &profile, nil
}

func (r *PgxRepository) ListRoadmapProgress(ctx context.Context, userID uuid.UUID) ([]RoadmapProgress, error) {
	const query = `
	SELECT r.slug, r.title, COUNT(n.id), COUNT(n.id) FILTER (WHERE p.status_roadmap = 'done')
	FROM roadmaps r
	JOIN roadmap_nodes n ON n.roadmap_id = r.id
	LEFT JOIN user_roadmap_progress p ON p.node_id = n.id AND p.user_id = $1
	GROUP BY r.id, r.slug, r.title
	HAVING COUNT(p.user_id) > 0
	ORDER BY r.title
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	progress := make([]RoadmapProgress, 0)
	for rows.Next() {
		var p RoadmapProgress
		if err := rows.Scan(&p.Slug, &p.Title, &p.TotalNodes, &p.DoneNodes); err != nil {
			return nil, err
		}
		progress = append(progress, p)
	}

	return progress, rows.Err()
}

func (r *PgxRepository) GetQuizStats(ctx context.Context, userID uuid.UUID) (QuizStats, error) {
	const query = `
	SELECT COUNT(*), COALESCE(MAX(score), 0), COALESCE(AVG(score), 0)
	FROM quizzes
	WHERE user_id = $1 AND submitted_at IS NOT NULL
	`

	var stats QuizStats
	err := r.db.QueryRow(ctx, query, userID).Scan(&stats.TotalTaken, &stats.BestScore, &stats.AverageScore)
	if err != nil {
		return QuizStats{}, err
	}

	return stats, nil
}

func (r *PgxRepository) GetPracticeStats(ctx context.Context, userID uuid.UUID) (PracticeStats, error) {
	const query = `
	SELECT COUNT(*), COALESCE(MAX(score), 0), COALESCE(AVG(score), 0)
	FROM practice_attempts
	WHERE user_id = $1
	`

	var stats PracticeStats
	err := r.db.QueryRow(ctx, query, userID).Scan(&stats.TotalAttempts, &stats.BestScore, &stats.AverageScore)
	if err != nil {
		return PracticeStats{}, err
	}

	return stats, nil
}
