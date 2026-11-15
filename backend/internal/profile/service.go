package profile

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrCurrentRoleIsReq = errors.New("current role is required")
	ErrTargetRoleIsReq  = errors.New("target role is required")
	ErrFieldTooLong     = errors.New("name and roles must be at most 100 characters")
)

const maxFieldLength = 100

type Stats struct {
	Roadmaps []RoadmapProgress `json:"roadmaps"`
	Quiz     QuizStats         `json:"quiz"`
	Practice PracticeStats     `json:"practice"`
	Streak   StreakStats       `json:"streak"`
}

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

func localDate(tz string, now time.Time) time.Time {
	local, err := time.LoadLocation(tz)
	// unknown or empty timezone: fall back to UTC
	if err != nil {
		local = time.UTC
	}
	year, month, day := now.In(local).Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

func (s *Service) GetStats(ctx context.Context, userID uuid.UUID, tz string) (*Stats, error) {
	roadmaps, err := s.repo.ListRoadmapProgress(ctx, userID)
	if err != nil {
		return nil, err
	}

	quiz, err := s.repo.GetQuizStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	practice, err := s.repo.GetPracticeStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	streak, err := s.repo.GetStreakStats(ctx, userID, localDate(tz, time.Now()))
	if err != nil {
		return nil, err
	}

	return &Stats{Roadmaps: roadmaps, Quiz: quiz, Practice: practice, Streak: streak}, nil
}
