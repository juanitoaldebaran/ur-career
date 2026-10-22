package ratelimit

import (
	"context"
	"sync"
	"time"
)

type window struct {
	count   int
	resetAt time.Time
}

type Memory struct {
	mu      sync.Mutex
	windows map[string]*window
	limit   int
	size    time.Duration
}

func NewMemory(limit int, size time.Duration) *Memory {
	return &Memory{
		windows: make(map[string]*window),
		limit:   limit,
		size:    size,
	}
}

func (m *Memory) Allow(_ context.Context, key string) (Result, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	m.sweep(now)

	w, ok := m.windows[key]
	if !ok || !now.Before(w.resetAt) {
		w := &window{resetAt: now.Add(m.size)}
		m.windows[key] = w
	}

	if w.count >= m.limit {
		return Result{
			Allowed:    false,
			RetryAfter: w.resetAt.Sub(now),
		}, nil
	}
	w.count++
	return Result{Allowed: true, Remaining: m.limit - w.count}, nil
}

func (m *Memory) sweep(now time.Time) {
	if len(m.windows) < 1000 {
		return
	}

	for k, w := range m.windows {
		if !now.Before(w.resetAt) {
			delete(m.windows, k)
		}
	}
}
