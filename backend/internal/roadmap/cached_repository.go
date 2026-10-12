package roadmap

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/juanitoaldebaran/ur-career-backend/internal/cache"
)

const CachePrefix = "roadmap:v1:"
const cacheTTL = 10 * time.Minute

type CachedRepository struct {
	Repository
	cache cache.Cache
	group cache.Group
}

func NewCachedRepository(repo Repository, c cache.Cache) *CachedRepository {
	return &CachedRepository{
		Repository: repo,
		cache:      c,
	}
}

func (r *CachedRepository) ListRoadmaps(ctx context.Context) ([]RoadmapSummary, error) {
	return cache.Remember(ctx, r.cache, &r.group, string(CachePrefix)+"list", cacheTTL, func() ([]RoadmapSummary, error) {
		return r.Repository.ListRoadmaps(ctx)
	})
}

func (r *CachedRepository) GetRoadmapBySlug(ctx context.Context, slug string) (*Roadmap, error) {
	return cache.Remember(ctx, r.cache, &r.group, string(CachePrefix)+"slug:"+slug, cacheTTL, func() (*Roadmap, error) {
		return r.Repository.GetRoadmapBySlug(ctx, slug)
	})
}

func (r *CachedRepository) ListNodes(ctx context.Context, roadmapID uuid.UUID) ([]Node, error) {
	return cache.Remember(ctx, r.cache, &r.group, string(CachePrefix)+"nodes:"+roadmapID.String(), cacheTTL, func() ([]Node, error) {
		return r.Repository.ListNodes(ctx, roadmapID)
	})
}
