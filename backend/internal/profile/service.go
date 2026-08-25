package profile

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

var (
	ErrCurrentRoleIsReq = errors.New("current role is required")
	ErrTargetRoleIsReq  = errors.New("target role is required")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, currentRole, targetRole string, contraints map[string]any) (*Profile, error) {
	if strings.TrimSpace(currentRole) == "" {
		return nil, ErrCurrentRoleIsReq
	}

	if strings.TrimSpace(targetRole) == "" {
		return nil, ErrTargetRoleIsReq
	}

	constraintsJSON, err := json.Marshal(contraints)
	if err != nil {
		return nil, fmt.Errorf("encode constrainsts: %w", err)
	}

	return s.repo.UpsertProfile(ctx, userID, currentRole, targetRole, constraintsJSON)
}

func (s *Service) GetProfile(ctx context.Context, userID uuid.UUID) (*Profile, error) {
	return s.repo.GetProfileByUserID(ctx, userID)
}
