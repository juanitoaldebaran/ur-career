package ratelimit

import (
	"net"
	"net/http"
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
