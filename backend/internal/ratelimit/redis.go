package ratelimit

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var slidingWindow = redis.NewScript(`
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local t   = redis.call('TIME')
local now = t[1] * 1000 + math.floor(t[2] / 1000)

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)
local count = redis.call('ZCARD', KEYS[1])

if count >= limit then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  local retry  = window - (now - tonumber(oldest[2]))
  return {0, 0, retry}
end

redis.call('ZADD', KEYS[1], now, ARGV[3])
redis.call('PEXPIRE', KEYS[1], window)
return {1, limit - count - 1, 0}
`)

type Redis struct {
	client redis.Client
	prefix string
	limit  int
	size   time.Duration
}

func NewRedis(client *redis.Client, prefix string, limit int, size time.Duration) *Redis {
	return &Redis{
		client: *client,
		prefix: prefix,
		limit:  limit,
		size:   size,
	}
}

func (r *Redis) Allow(ctx context.Context, key string) (Result, error) {
	out, err := slidingWindow.Run(ctx, r.client, []string{r.prefix, key}, r.limit, r.size.Milliseconds(), uuid.NewString()).Int64Slice()
	if err != nil {
		return Result{}, fmt.Errorf("sliding window script: %w", err)
	}

	return Result{
		Allowed:    out[0] == 1,
		Remaining:  int(out[1]),
		RetryAfter: time.Duration(out[2]) * time.Millisecond,
	}, nil
}
