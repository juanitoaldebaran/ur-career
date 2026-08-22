package profile

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type Service struct {
	repo *PgxRepository
}

func NewService(repo *PgxRepository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, currentRole, targetRole string, contraints map[string]any) (*Profile, error) {
	if strings.TrimSpace(currentRole) == "" {
		return nil, errors.New("current role is required")
	}

	if strings.TrimSpace(targetRole) == "" {
		return nil, errors.New("target role is required")
	}

	constraintsJSON, err := json.Marshal(contraints)
	if err != nil {
		return nil, fmt.Errorf("encode constrainsts: %w", err)
	}

	return s.repo.UpsertProfile(ctx, userID, currentRole, targetRole, constraintsJSON)
}
