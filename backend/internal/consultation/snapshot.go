package consultation

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/juanitoaldebaran/ur-career-backend/internal/profile"
)

type SnapshotSource interface {
	Snapshot(ctx context.Context, userID uuid.UUID, tz string) (string, error)
}

type ProfileSnapshot struct {
	svc *profile.Service
}

func NewProfileSnapshot(svc *profile.Service) *ProfileSnapshot {
	return &ProfileSnapshot{svc: svc}
}

func clean(s string) string {
	s = strings.Map(func(r rune) rune {
		switch r {
		case '\n', '\r', '\t':
			return ' '
		case '<', '>':
			return -1
		}
		return r
	}, s)
	s = strings.TrimSpace(s)
	if r := []rune(s); len(r) > 100 {
		s = string(r[:100])
	}
	return s
}

func orNotSet(s string) string {
	if s = clean(s); s == "" {
		return "not set"
	}
	return s
}

func (p *ProfileSnapshot) Snapshot(ctx context.Context, userID uuid.UUID, tz string) (string, error) {
	var b strings.Builder

	prof, err := p.svc.GetProfile(ctx, userID)
	switch {
	case err == nil:
		fmt.Fprintf(&b, "Current role: %s\n", orNotSet(prof.CurrentRole))
		fmt.Fprintf(&b, "Target role: %s\n", orNotSet(prof.TargetRole))
	case errors.Is(err, profile.ErrProfileNotFound):
		b.WriteString("Profile: not filled in yet\n")
	default:
		return "", err
	}

	stats, err := p.svc.GetStats(ctx, userID, tz)
	if err != nil {
		return "", err
	}

	if len(stats.Roadmaps) == 0 {
		b.WriteString("Roadmaps: none started\n")
	}
	for _, r := range stats.Roadmaps {
		fmt.Fprintf(&b, "Roadmap %q: %d of %d topics done\n", clean(r.Title), r.DoneNodes, r.TotalNodes)
	}
	if stats.Quiz.TotalTaken > 0 {
		fmt.Fprintf(&b, "Quizzes: %d taken, best %d, average %d (out of 100)\n",
			stats.Quiz.TotalTaken, stats.Quiz.BestScore, stats.Quiz.AverageScore)
	} else {
		b.WriteString("Quizzes: none taken\n")
	}
	if stats.Practice.TotalAttempts > 0 {
		fmt.Fprintf(&b, "Practice: %d attempts, best %d, average %d (out of 100)\n",
			stats.Practice.TotalAttempts, stats.Practice.BestScore, stats.Practice.AverageScore)
	} else {
		b.WriteString("Practice: no attempts\n")
	}
	fmt.Fprintf(&b, "Daily streak: %d days (longest %d)\n", stats.Streak.Current, stats.Streak.Longest)

	return b.String(), nil
}
