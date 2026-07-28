package auth

import "time"

type Users struct {
	Id        uint       `json:""`
	Email     string     `json:""`
	Timestamp *time.Time `json:""`
}
