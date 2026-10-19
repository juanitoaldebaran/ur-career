package ratelimit

import (
	"context"
	"log"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/juanitoaldebaran/ur-career-backend/internal/httpx"
)

type visitor struct {
	count   int
	resetAt time.Time
}

type Limiter struct {
	mu      sync.Mutex
	visitor map[string]*visitor
	limit   int
	window  time.Duration
}

type Result struct {
	Allowed    bool
	Remaining  int
	RetryAfter time.Duration
}

type Store interface {
	Allow(ctx context.Context, key string) (Result, error)
}

type KeyFunc func(r *http.Request) (string, bool)

func IPKey(r *http.Request) (string, bool) {
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr, true
	}

	return ip, true
}

type RedisLimiter struct {
	store      Store
	redisLimit int
	failOpen   bool
	key        KeyFunc
}

func NewRedisLimiter(store Store, redisLimit int, failOpen bool, key KeyFunc) *RedisLimiter {
	return &RedisLimiter{
		store:      store,
		redisLimit: redisLimit,
		failOpen:   failOpen,
		key:        key,
	}
}

func (l *RedisLimiter) RedisLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key, ok := l.key(r)
		if !ok {
			next.ServeHTTP(w, r)
			return
		}

		res, err := l.store.Allow(r.Context(), key)
		if err != nil {
			log.Printf("ratelimit: %v", err)
			if !l.failOpen {
				httpx.WriteError(w, http.StatusServiceUnavailable, "service temporary unavailable")
				return
			}
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("X-RateLimit-Limit", strconv.Itoa(l.redisLimit))
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(res.Remaining))

		if !res.Allowed {
			seconds := int((res.RetryAfter + time.Second - 1) / time.Second)
			w.Header().Set("Retry-After", strconv.Itoa(max(seconds, 1)))
			httpx.WriteError(w, http.StatusTooManyRequests, "too many requests, try again later")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func New(limit int, window time.Duration) *Limiter {
	return &Limiter{
		visitor: make(map[string]*visitor),
		limit:   limit,
		window:  window,
	}
}

func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	value, exists := l.visitor[key]
	if !exists || now.After(value.resetAt) {
		l.visitor[key] = &visitor{count: 1, resetAt: now.Add(l.window)}
		return true
	}

	if value.count >= l.limit {
		return false
	}

	value.count++
	return true
}

func (l *Limiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}

		if !l.Allow(ip) {
			httpx.WriteError(w, http.StatusTooManyRequests, "too many request, try again later")
			return
		}

		next.ServeHTTP(w, r)
	})
}
