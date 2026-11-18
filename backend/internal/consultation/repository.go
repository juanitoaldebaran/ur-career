package consultation

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrConversationNotFound = errors.New("conversation not found")
	ErrBusy                 = errors.New("a reply is already being generated")
)

const defaultTitle = "New chat"

type PgxRepository struct {
	db *pgxpool.Pool
}

type Message struct {
	ID        uuid.UUID `json:"id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type NewMessage struct {
	Role             string
	Content          string
	Status           string
	PromptTokens     int
	CompletionTokens int
	Model            string
}

type Conversation struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Repository interface {
	CreateConversation(ctx context.Context, userID uuid.UUID) (*Conversation, error)
	GetConversation(ctx context.Context, userID, id uuid.UUID) (*Conversation, error)
	ListConversations(ctx context.Context, userID uuid.UUID, cur *cursor, limit int) ([]Conversation, error) // up to limit+1, newest first
	DeleteConversation(ctx context.Context, userID, id uuid.UUID) error
	SetTitle(ctx context.Context, id uuid.UUID, title string) error

	ListMessages(ctx context.Context, conversationID uuid.UUID, cur *cursor, limit int) ([]Message, error) // up to limit+1, newest first
	RecentMessages(ctx context.Context, conversationID uuid.UUID, n int) ([]Message, error)                // last n, oldest first
	AddMessage(ctx context.Context, conversationID uuid.UUID, m NewMessage) (*Message, error)

	AcquireLock(ctx context.Context, userID, id uuid.UUID) (bool, error)
	ReleaseLock(ctx context.Context, id uuid.UUID) error
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) ListConversations(ctx context.Context, userID uuid.UUID, cur *cursor, limit int) ([]Conversation, error) {
	var (
		rows pgx.Rows
		err  error
	)
	if cur == nil {
		rows, err = r.db.Query(ctx,
			`SELECT id, title, created_at, updated_at
			FROM conversations
			WHERE user_id = $1 
			ORDER BY updated_at DESC, id DESC
			LIMIT $2 
			`, userID, limit+1)
	} else {
		rows, err = r.db.Query(ctx,
			`SELECT id, title, created_at, updated_at
			FROM conversations
			WHERE user_id = $1 AND (updated_at, id) < ($2, $3)
			ORDER BY updated_at DESC, id DESC
			LIMIT $4
			`, userID, cur.T, cur.ID, limit+1)
	}

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	out := make([]Conversation, 0, limit+1)
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(&c.ID, &c.Title, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}

	return out, rows.Err()
}

func (r *PgxRepository) CreateConversation(ctx context.Context, userID uuid.UUID) (*Conversation, error) {
	const query = `INSERT INTO conversations (user_id) VALUES ($1) RETURNING id, title, created_at, updated_at`

	var c Conversation
	if err := r.db.QueryRow(ctx, query, userID).Scan(&c.ID, &c.Title, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *PgxRepository) DeleteConversation(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	const query = `DELETE FROM conversations WHERE id = $1 AND user_id = $2`

	tag, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrConversationNotFound
	}

	return nil
}

func (r *PgxRepository) SetTitle(ctx context.Context, id uuid.UUID, title string) error {
	_, err := r.db.Exec(ctx, `UPDATE conversations SET title = $2 WHERE id = $1`, id, title)
	return err
}

func (r *PgxRepository) GetConversation(ctx context.Context, userID, id uuid.UUID) (*Conversation, error) {
	const query = `SELECT id, title, created_at, updated_at
	FROM conversations
	WHERE id = $1 AND user_id = $2`

	var c Conversation
	err := r.db.QueryRow(ctx, query, id, userID).Scan(&c.ID, &c.Title, &c.CreatedAt, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConversationNotFound
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *PgxRepository) ListMessages(ctx context.Context, conversationID uuid.UUID, cur *cursor, limit int) ([]Message, error) {
	var (
		rows pgx.Rows
		err  error
	)

	if cur == nil {
		rows, err = r.db.Query(ctx, `SELECT id, role, content, status, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at DESC, id DESC
		LIMIT $2`, conversationID, limit+1)
	} else {
		rows, err = r.db.Query(ctx, `SELECT id, role, content, status, created_at
		FROM messages
		WHERE conversation_id = $1 AND (created_at, id) < ($2, $3)
		ORDER BY created_at DESC, id DESC
		LIMIT $4`, conversationID, cur.T, cur.ID, limit+1)
	}

	if err != nil {
		return nil, err
	}

	defer rows.Close()
	return scanMessages(rows, limit+1)
}

func (r *PgxRepository) RecentMessages(ctx context.Context, conversationID uuid.UUID, n int) ([]Message, error) {
	rows, err := r.db.Query(ctx, `SELECT id, role, content, status, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at DESC, id DESC
		LIMIT $2`, conversationID, n)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages, err := scanMessages(rows, n)
	if err != nil {
		return nil, err
	}
	reverse(messages) // SQL gave newest-first; the prompt needs oldest-first
	return messages, nil
}

func scanMessages(rows pgx.Rows, capHint int) ([]Message, error) {
	messages := make([]Message, 0, capHint)
	for rows.Next() {
		var message Message
		if err := rows.Scan(&message.ID, &message.Role, &message.Content, &message.Status, &message.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, message)
	}

	return messages, rows.Err()
}

func reverse[T any](s []T) {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
}

func (r *PgxRepository) AddMessage(ctx context.Context, conversationID uuid.UUID, newMsg NewMessage) (*Message, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}

	defer tx.Rollback(ctx)
	var out Message
	err = tx.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, role, content, status, prompt_tokens, completion_tokens, model)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, role, content, status, created_at`,
		conversationID, newMsg.Role, newMsg.Content, newMsg.Status, newMsg.PromptTokens, newMsg.CompletionTokens, newMsg.Model,
	).Scan(&out.ID, &out.Role, &out.Content, &out.Status, &out.CreatedAt)

	if err != nil {
		return nil, err
	}

	// Bump the chat so the history panel sorts by latest activity.
	if _, err := tx.Exec(ctx, `UPDATE conversations SET updated_at = now() WHERE id = $1`, conversationID); err != nil {
		return nil, err
	}

	return &out, tx.Commit(ctx)
}

func (r *PgxRepository) AcquireLock(ctx context.Context, userID, id uuid.UUID) (bool, error) {
	tag, err := r.db.Exec(ctx, `
	UPDATE conversations
	SET generating_since = now()
	WHERE id = $1 AND user_id = $2
	AND (generating_since IS NULL OR generating_since < now() - interval '2 minutes')
	`, id, userID)

	if err != nil {
		return false, err
	}

	return tag.RowsAffected() == 1, nil
}

func (r *PgxRepository) ReleaseLock(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE conversations SET generating_since = NULL WHERE id = $1`, id)
	return err
}
