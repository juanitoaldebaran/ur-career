package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
	ErrInvalidEmail       = errors.New("invalid email address")
	emailRegex            = regexp.MustCompile(`^[a-zA-Z0-9.!#$%&'*+/=?^_` + "`" + `{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$`)
)

const maxEmailLength = 254

type Service struct {
	repo          Repository
	jwtSecret     []byte
	tokenExpiry   time.Duration
	refreshExpiry time.Duration
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func NewService(repo Repository, jwtSecret string, tokenExpiry, refreshExpiry time.Duration) *Service {
	return &Service{
		repo:          repo,
		jwtSecret:     []byte(jwtSecret),
		tokenExpiry:   tokenExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (s *Service) Register(ctx context.Context, rawEmail, password string) (*Users, error) {
	email, err := normalizeEmail(rawEmail)
	if err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	return s.repo.CreateUser(ctx, email, string(hash))
}

func (s *Service) Login(ctx context.Context, rawEmail, password string) (string, string, error) {
	email, err := normalizeEmail(rawEmail)
	if err != nil {
		return "", "", ErrInvalidCredentials
	}

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return "", "", ErrInvalidCredentials
		}
		return "", "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", ErrInvalidCredentials
	}

	accessToken, err := s.generateToken(user)
	if err != nil {
		return "", "", err
	}

	refreshRawToken, err := generateRefreshTokenValue()
	if err != nil {
		return "", "", err
	}

	_, err = s.repo.CreateRefreshToken(ctx, user.Id, hashToken(refreshRawToken), time.Now().Add(s.refreshExpiry))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshRawToken, nil
}

func (s *Service) generateToken(user *Users) (string, error) {
	now := time.Now()
	userID := user.Id.String()
	claims := Claims{
		UserID: userID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.tokenExpiry)),
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *Service) ParseToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		return s.jwtSecret, nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func generateRefreshTokenValue() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func normalizeEmail(raw string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(raw))
	if len(email) > maxEmailLength || !emailRegex.MatchString(email) {
		return "", ErrInvalidEmail
	}
	return email, nil
}

func (s *Service) Logout(ctx context.Context, rawToken string) error {
	return s.repo.RevokeRefreshToken(ctx, hashToken(rawToken))
}

func (s *Service) Refresh(ctx context.Context, rawRefreshToken string) (string, string, error) {
	tokenHash := hashToken(rawRefreshToken)

	refreshToken, err := s.repo.ClaimRefreshToken(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, ErrRefreshTokenNotFound) {
			return "", "", ErrInvalidToken
		}
		return "", "", err
	}

	user, err := s.repo.GetUserByID(ctx, refreshToken.UserID)
	if err != nil {
		return "", "", err
	}

	accessToken, err := s.generateToken(user)
	if err != nil {
		return "", "", err
	}

	newRawRefreshToken, err := generateRefreshTokenValue()
	if err != nil {
		return "", "", err
	}

	if _, err := s.repo.CreateRefreshToken(ctx, user.Id, hashToken(newRawRefreshToken), time.Now().Add(s.refreshExpiry)); err != nil {
		return "", "", err
	}

	return accessToken, newRawRefreshToken, nil
}
