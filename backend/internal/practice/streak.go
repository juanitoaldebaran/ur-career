package practice

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Streak struct {
	Current  int  `json:"current"`
	Longest  int  `json:"longest"`
	IsNewDay bool `json:"is_new_day"`
}

type StreakRepository interface {
	Record(ctx context.Context, userID uuid.UUID, today time.Time) (Streak, error)
}

type PgxStreakRepository struct {
	db *pgxpool.Pool
}

func NewPgxStreakRepository(db *pgxpool.Pool) *PgxStreakRepository {
	return &PgxStreakRepository{
		db: db,
	}
}

func localDate(tz string, now time.Time) time.Time {
	local, err := time.LoadLocation(tz)
	/// if failed use local date
	if err != nil {
		local = time.UTC
	}
	year, month, day := now.In(local).Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

func advance(current, longest int, last *time.Time, today time.Time) Streak {
	isNewDay := true
	switch {
	case last != nil && last.Equal(today):
		isNewDay = false
	case last != nil && last.Equal(today.AddDate(0, 0, -1)):
		current += 1
	default:
		current = 1
	}

	if current > longest {
		longest = current
	}

	return Streak{
		Current:  current,
		Longest:  longest,
		IsNewDay: isNewDay,
	}
}

func (r *PgxStreakRepository) Record(ctx context.Context, userID uuid.UUID, today time.Time) (Streak, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Streak{}, nil
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `INSERT INTO user_streaks (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, userID); err != nil {
		return Streak{}, err
	}

	var curr, longest int
	var last *time.Time
	if err := tx.QueryRow(ctx,
		`SELECT current_streak, longest_streak, last_activity_date
		 FROM user_streaks WHERE user_id = $1 FOR UPDATE
		`, userID).Scan(&curr, &longest); err != nil {
		return Streak{}, nil
	}

	next := advance(curr, longest, last, today)
	if next.IsNewDay {
		if _, err := tx.Exec(ctx, `UPDATE user_streaks SET current_streak = $2, longest_streak = $3, last_activity_date = $4, updated_at = now() WHERE user_id = $1)`,
			userID, next.Current, next.Longest, today); err != nil {
			return Streak{}, nil
		}
	}

	return next, tx.Commit(ctx)
}
