package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Users struct {
	Id           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"password_hash"`
	CreatedAt    time.Time `json:"created_at"`
}

var (
	ErrUserNotFound          = errors.New("error user not found")
	ErrUserHasAlreadyExisted = errors.New("user has already existed")
)

type Repository interface {
	CreateUser(ctx context.Context, email, password_hash string) (*Users, error)
	GetUserByEmail(ctx context.Context, email string) (*Users, error)
}

type PgxRepository struct {
	db *pgxpool.Pool
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) CreateUser(ctx context.Context, email, password_hash string) (*Users, error) {
	const query = `
	INSERT INTO users (email, password_hash)
	VALUES ($1, $2)
	RETURNING id, email, password_hash, created_at
	`
	var user Users
	err := r.db.QueryRow(ctx, query, email, password_hash).Scan(
		&user.Id,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUserHasAlreadyExisted
		}
		return nil, err
	}

	return &user, nil
}

func (r *PgxRepository) GetUserByEmail(ctx context.Context, email string) (*Users, error) {
	query :=
		`
	SELECT id, email, password_hash, created_at
	FROM users
	WHERE email = $1
	`
	var users Users
	err := r.db.QueryRow(ctx, query, email).Scan(
		&users.Id,
		&users.Email,
		&users.PasswordHash,
		&users.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &users, nil
}
