package consultation

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/juanitoaldebaran/ur-career-backend/internal/practice/ai"
	"golang.org/x/sync/errgroup"
)

var (
	ErrInvalidMessage = errors.New("message must be between 1 and 4000 characters")
	ErrModel          = errors.New("could not get a response from the model")
)

const (
	maxMessageRunes = 4000
	historyTurns    = 12
	titleRunes      = 60
)

// *ai.Gemini satisfies this; tests pass a fake.
type ChatModel interface {
	Stream(ctx context.Context, system string, turns []ai.Turn) (<-chan ai.Chunk, error)
	Model() string
}

type Service struct {
	repo      Repository
	model     ChatModel
	snapshots SnapshotSource
}

func NewService(repo Repository, model ChatModel, snapshots SnapshotSource) *Service {
	return &Service{repo: repo, model: model, snapshots: snapshots}
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID) (*Conversation, error) {
	return s.repo.CreateConversation(ctx, userID)
}

func (s *Service) Delete(ctx context.Context, userID, id uuid.UUID) error {
	return s.repo.DeleteConversation(ctx, userID, id)
}

func (s *Service) List(ctx context.Context, userID uuid.UUID, rawCursor string, limit int) (*Page[Conversation], error) {
	cur, err := decodeCursor(rawCursor)
	if err != nil {
		return nil, err
	}
	rows, err := s.repo.ListConversations(ctx, userID, cur, limit)
	if err != nil {
		return nil, err
	}

	page := &Page[Conversation]{Items: rows}
	if len(rows) > limit { // the extra row means another page exists
		page.HasMore = true
		page.Items = rows[:limit]
		last := page.Items[limit-1]
		page.NextCursor = encodeCursor(cursor{T: last.UpdatedAt, ID: last.ID})
	}
	return page, nil
}

// Items are oldest-first inside the page. NextCursor points at the oldest message
// returned, so the client asks for "older than this".
func (s *Service) Messages(ctx context.Context, userID, convID uuid.UUID, rawCursor string, limit int) (*Page[Message], error) {
	if _, err := s.repo.GetConversation(ctx, userID, convID); err != nil { // ownership
		return nil, err
	}
	cur, err := decodeCursor(rawCursor)
	if err != nil {
		return nil, err
	}
	rows, err := s.repo.ListMessages(ctx, convID, cur, limit)
	if err != nil {
		return nil, err
	}

	page := &Page[Message]{Items: rows}
	if len(rows) > limit {
		page.HasMore = true
		page.Items = rows[:limit]
		oldest := page.Items[limit-1]
		page.NextCursor = encodeCursor(cursor{T: oldest.CreatedAt, ID: oldest.ID})
	}
	reverse(page.Items)
	return page, nil
}

// onDelta is called for each piece of text. Errors returned before the first
// onDelta call can still become normal HTTP status codes.
func (s *Service) Send(ctx context.Context, userID, convID uuid.UUID, content, tz string, onDelta func(string)) (*Message, *ai.Usage, error) {
	content = strings.TrimSpace(content)
	if n := utf8.RuneCountInString(content); n < 1 || n > maxMessageRunes {
		return nil, nil, ErrInvalidMessage
	}

	conv, err := s.repo.GetConversation(ctx, userID, convID) // ownership check
	if err != nil {
		return nil, nil, err
	}

	ok, err := s.repo.AcquireLock(ctx, userID, convID)
	if err != nil {
		return nil, nil, err
	}
	if !ok {
		return nil, nil, ErrBusy
	}
	// Release even if the client disconnected (ctx cancelled).
	defer func() {
		rctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
		defer cancel()
		if err := s.repo.ReleaseLock(rctx, convID); err != nil {
			log.Printf("consultation: release lock: %v", err)
		}
	}()

	if _, err := s.repo.AddMessage(ctx, convID, NewMessage{Role: "user", Content: content, Status: "complete"}); err != nil {
		return nil, nil, err
	}
	if conv.Title == defaultTitle {
		if err := s.repo.SetTitle(ctx, convID, titleFrom(content)); err != nil {
			log.Printf("consultation: set title: %v", err) // cosmetic; don't fail the chat
		}
	}

	// Fetch what the prompt needs concurrently. A missing snapshot degrades the
	// answer but must not break the chat.
	var (
		snapshot string
		history  []Message
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		snap, err := s.snapshots.Snapshot(gctx, userID, tz)
		if err != nil {
			log.Printf("consultation: snapshot: %v", err)
			return nil
		}
		snapshot = snap
		return nil
	})
	g.Go(func() (err error) {
		history, err = s.repo.RecentMessages(gctx, convID, historyTurns)
		return err
	})
	if err := g.Wait(); err != nil {
		return nil, nil, err
	}

	turns := make([]ai.Turn, 0, len(history))
	for _, m := range history {
		turns = append(turns, ai.Turn{Role: m.Role, Text: m.Content})
	}

	// No DB connection is held from here on: the stream can take many seconds.
	chunks, err := s.model.Stream(ctx, buildSystem(snapshot), turns)
	if err != nil {
		log.Printf("consultation: stream start: %v", err)
		return nil, nil, ErrModel
	}

	var (
		text   strings.Builder
		usage  *ai.Usage
		status = "complete"
		cause  error
	)
	for chunk := range chunks {
		switch {
		case chunk.Err != nil:
			status, cause = "error", chunk.Err
		case chunk.Usage != nil:
			usage = chunk.Usage
		default:
			text.WriteString(chunk.Text)
			onDelta(chunk.Text)
		}
	}
	if ctx.Err() != nil && status == "complete" {
		status = "interrupted" // the client went away
	}

	if text.Len() == 0 {
		if cause != nil {
			log.Printf("consultation: stream: %v", cause)
		}
		return nil, nil, ErrModel
	}
	if cause != nil {
		log.Printf("consultation: stream interrupted: %v", cause)
		status = "interrupted"
	}

	nm := NewMessage{Role: "assistant", Content: text.String(), Status: status, Model: s.model.Model()}
	if usage != nil {
		nm.PromptTokens, nm.CompletionTokens = usage.PromptTokens, usage.CompletionTokens
	}

	// Save even if the client disconnected, using a fresh short deadline.
	sctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
	defer cancel()
	saved, err := s.repo.AddMessage(sctx, convID, nm)
	if err != nil {
		return nil, nil, err
	}
	return saved, usage, nil
}

func titleFrom(content string) string {
	t := strings.Join(strings.Fields(content), " ")
	if r := []rune(t); len(r) > titleRunes {
		return string(r[:titleRunes]) + "…"
	}
	return t
}
