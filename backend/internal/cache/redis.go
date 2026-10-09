package cache

import (
	"github.com/redis/go-redis"
)

type Redis struct {
	client *redis.Client
}
