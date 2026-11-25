package cvreview

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
)

var (
	ErrNotPDF        = errors.New("file must be a PDF")
	ErrInvalidRole   = errors.New("target role must be between 1 and 100 characters")
	ErrGradingFailed = errors.New("grading failed")
)

type Service struct {
	repo   Repository
	grader Grader
}

func NewService(repo Repository, grader Grader) *Service {
	return &Service{repo: repo, grader: grader}
}

func (s *Service) Review(ctx context.Context, userID uuid.UUID, pdf []byte, role string) (*Review, error) {
	role = strings.TrimSpace(role)
	if role == "" || utf8.RuneCountInString(role) > 100 {
		return nil, ErrInvalidRole
	}

	if !bytes.HasPrefix(pdf, []byte("%PDF-")) {
		return nil, ErrNotPDF
	}

	sum := sha256.Sum256(pdf)
	hash := hex.EncodeToString(sum[:])

	existing, err := s.repo.Find(ctx, userID, hash, role)
	if err == nil {
		return existing, nil
	}

	if !errors.Is(err, ErrNotFound) {
		return nil, err
	}

	gradePDF, err := s.grader.Grade(ctx, pdf, role)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGradingFailed, err)
	}

	review, err := score(gradePDF, role)
	if err != nil {
		return nil, err
	}

	return s.repo.Save(ctx, userID, hash, s.grader.Model(), review)
}

func score(g *Grade, role string) (*Review, error) {
	r := &Review{TargetRole: role, Summary: g.Summary}
	seen := map[string]bool{}
	for _, c := range g.Criteria {
		limit, ok := maxScores[c.Name]
		if !ok || seen[c.Name] {
			continue
		}
		seen[c.Name] = true
		c.Max = limit
		c.Score = min(max(c.Score, 0), limit)
		r.Score += c.Score
		r.Criteria = append(r.Criteria, c)
	}
	if len(seen) != len(maxScores) {
		return nil, fmt.Errorf("%w: missing criteria", ErrGradingFailed)
	}
	return r, nil
}
