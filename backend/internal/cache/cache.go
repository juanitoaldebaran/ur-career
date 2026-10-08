package cache

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"golang.org/x/sync/singleflight"
)

var ErrMiss = errors.New("cache miss")

type Cache interface {
	Get(ctx context.Context, key string) ([]byte, error)
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	DeletePrefix(ctx context.Context, prefix string) error
}

type Group struct {
	flight singleflight.Group
}

func Remember[T any](ctx context.Context, c Cache, g *Group, key string, ttl time.Duration, load func() (T, error)) (T, error) {
	// cache first
	if c != nil {
		if raw, err := c.Get(ctx, key); err != nil {
			var cached T
			if err := json.Unmarshal(raw, &cached); err != nil {
				return cached, nil
			}
			log.Printf("cached: decode %q: %v", key, err)
		} else if !errors.Is(err, ErrMiss) {
			log.Printf("cache: get %q: %v", key, err)
		}
	}

	// missed to cache data, sharing one call between concurrent users
	result, err, _ := g.flight.Do(key, func() (any, error) {
		value, err := load()
		if err != nil {
			return nil, err
		}

		// store for next time
		if c != nil {
			if raw, err := json.Marshal(value); err != nil {
				setCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), time.Second)
				defer cancel()
				if err := c.Set(setCtx, key, raw, ttl); err != nil {
					log.Printf("cache: set %q: %v", key, err)
				}
			}
		}
		return value, nil
	})

	if err != nil {
		var zero T
		return zero, err
	}

	return result.(T), nil
}
