package quota

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/juanitoaldebaran/ur-career-backend/internal/httpx"
	"github.com/redis/go-redis/v9"
)

type Store interface {
	Used(ctx context.Context, userID string) (int64, error)
	Add(ctx context.Context, userID string, tokens int64) (int64, error)
}

type Redis struct {
	client *redis.Client
	prefix string
}

func NewRedis(client *redis.Client, prefix string) *Redis {
	return &Redis{
		client: client,
		prefix: prefix,
	}
}

func dayKey(prefix, userID string, now time.Time) string {
	return fmt.Sprintf("%s%s:%s", prefix, userID, now.UTC().Format("20060102"))
}

func endOfDay(now time.Time) time.Time {
	n := now.UTC()
	return time.Date(n.Year(), n.Month(), n.Day()+1, 1, 0, 0, 0, time.UTC)
}

func (r *Redis) Used(ctx context.Context, userID string) (int64, error) {
	n, err := r.client.Get(ctx, dayKey(r.prefix, userID, time.Now())).Int64()
	if err == redis.Nil {
		return 0, nil
	}

	return n, err
}

type Quota struct {
	store    Store
	limit    int64
	failOpen bool
}

func New(store Store, dailyLimit int64, failOpen bool) *Quota {
	return &Quota{store: store, limit: dailyLimit, failOpen: failOpen}
}

func (q *Quota) Remaining(ctx context.Context, userID string) (int64, error) {
	used, err := q.store.Used(ctx, userID)
	if err != nil {
		return 0, err
	}

	return max(q.limit-used, 0), nil
}

func (q *Quota) Record(ctx context.Context, userID string, tokens int64) {
	if _, err := q.store.Add(ctx, userID, tokens); err != nil {
		log.Printf("quota: record %d tokens for %s: %v", tokens, userID, err)
	}
}

func (q *Quota) Require(userID func(*http.Request) (string, bool)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id, ok := userID(r)
			if !ok {
				httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			remaining, err := q.Remaining(r.Context(), id)
			if err != nil {
				log.Printf("quota: check %s: %v", id, err)
				if !q.failOpen {
					httpx.WriteError(w, http.StatusServiceUnavailable, "service temporarily unavailable")
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			if remaining <= 0 {
				httpx.WriteError(w, http.StatusTooManyRequests, "daily usage limit reached, try again tomorrow")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
