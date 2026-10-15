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
	ErrFieldTooLong     = errors.New("name and roles must be at most 100 characters")
)

const maxFieldLength = 100

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName, currentRole, targetRole string, contraints map[string]any) (*Profile, error) {
	fullName = strings.TrimSpace(fullName)
	currentRole = strings.TrimSpace(currentRole)
	targetRole = strings.TrimSpace(targetRole)

	if strings.TrimSpace(currentRole) == "" {
		return nil, ErrCurrentRoleIsReq
	}

	if strings.TrimSpace(targetRole) == "" {
		return nil, ErrTargetRoleIsReq
	}

	if len(fullName) > maxFieldLength || len(currentRole) > maxFieldLength || len(targetRole) > maxFieldLength {
		return nil, ErrFieldTooLong
	}

	constraintsJSON, err := json.Marshal(contraints)
	if err != nil {
		return nil, fmt.Errorf("encode constrainsts: %w", err)
	}

	return s.repo.UpsertProfile(ctx, userID, fullName, currentRole, targetRole, constraintsJSON)
}

func (s *Service) GetProfile(ctx context.Context, userID uuid.UUID) (*Profile, error) {
	return s.repo.GetProfileByUserID(ctx, userID)
}
