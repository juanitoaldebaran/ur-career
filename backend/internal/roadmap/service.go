package roadmap

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

var (
	errInvalidStatus = errors.New("invalid status")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) ListRoadmaps(ctx context.Context) ([]RoadmapSummary, error) {
	return s.repo.ListRoadmaps(ctx)
}

func (s *Service) GetNodes(ctx context.Context, userID uuid.UUID, slug string) ([]Node, error) {
	roadmap, err := s.repo.GetRoadmapBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	nodeLists, err := s.repo.ListNodes(ctx, roadmap.ID)
	if err != nil {
		return nil, err
	}

	progress, err := s.repo.GetUserProgress(ctx, userID, roadmap.ID)
	if err != nil {
		return nil, err
	}

	for i := range nodeLists {
		if status, ok := progress[nodeLists[i].ID]; ok {
			nodeLists[i].Status = status
		} else {
			nodeLists[i].Status = "pending"
		}
	}

	return nodeLists, nil
}

func (s *Service) UpdateStatus(ctx context.Context, userID, nodeID uuid.UUID, status string) error {

	statusLists := map[string]bool{
		"pending":     true,
		"in_progress": true,
		"done":        true,
	}

	if statusLists[status] {
		err := s.repo.UpsertProgress(ctx, userID, nodeID, status)
		if err != nil {
			return err
		}
	} else {
		return errInvalidStatus
	}

	return nil
}
