package practice

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Streak struct {
	Current  int  `json:"current"`
	Longest  int  `json:"longest"`
	IsNewDay bool `json:"is_new_day"`
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
