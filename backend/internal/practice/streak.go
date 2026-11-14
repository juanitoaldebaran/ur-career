package practice

import "github.com/jackc/pgx/v5/pgxpool"

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
