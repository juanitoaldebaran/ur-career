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
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type RefreshToken struct {
	UserID    uuid.UUID  `json:"user_id"`
	TokenHash string     `json:"token_hash"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at"`
	CreatedAt time.Time  `json:"created_at"`
}

var (
	ErrUserNotFound          = errors.New("error user not found")
	ErrUserHasAlreadyExisted = errors.New("user has already existed")
	ErrRefreshTokenNotFound  = errors.New("refresh token not found")
)

type Repository interface {
	CreateUser(ctx context.Context, email, password_hash string) (*Users, error)
	GetUserByEmail(ctx context.Context, email string) (*Users, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*Users, error)
	CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) (*RefreshToken, error)
	GetRefreshToken(ctx context.Context, tokenHash string) (*RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, tokenHash string) error
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
	const query = `
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

func (r *PgxRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*Users, error) {
	const query = `
	SELECT id, email, password_hash, created_at
	FROM users
	WHERE id = $1
	`
	var users Users
	err := r.db.QueryRow(ctx, query, id).Scan(
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

func (r *PgxRepository) CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) (*RefreshToken, error) {
	const query = `
	INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
	VALUES ($1, $2, $3)
	RETURNING user_id, token_hash, expires_at, revoked_at, created_at
	`
	var refreshToken RefreshToken
	err := r.db.QueryRow(ctx, query, userID, tokenHash, expiresAt).Scan(
		&refreshToken.UserID,
		&refreshToken.TokenHash,
		&refreshToken.ExpiresAt,
		&refreshToken.RevokedAt,
		&refreshToken.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &refreshToken, nil
}

func (r *PgxRepository) GetRefreshToken(ctx context.Context, tokenHash string) (*RefreshToken, error) {
	const query = `
	SELECT user_id, token_hash, expires_at, revoked_at, created_at
	FROM refresh_tokens
	WHERE token_hash = $1
	`

	var refreshToken RefreshToken
	err := r.db.QueryRow(ctx, query, tokenHash).Scan(
		&refreshToken.UserID,
		&refreshToken.TokenHash,
		&refreshToken.ExpiresAt,
		&refreshToken.RevokedAt,
		&refreshToken.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRefreshTokenNotFound
		}
		return nil, err
	}

	return &refreshToken, nil
}

func (r *PgxRepository) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	const query = `
	UPDATE refresh_tokens
	SET revoked_at = now()
	WHERE token_hash = $1 AND revoked_at IS NULL
	`

	tag, err := r.db.Exec(ctx, query, tokenHash)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrRefreshTokenNotFound
	}

	return nil
}
