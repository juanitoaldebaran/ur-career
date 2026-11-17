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
	ErrConversationError    = errors.New("conversation not found")
	ErrConversationNotError = errors.New("conversation not error")
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

type Conversation struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"string"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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

	tag, err := r.db.Exec(ctx, query, userID, id)
	if err != nil {
		return nil
	}

	if tag.RowsAffected() == 0 {
		return ErrConversationNotError
	}

	return nil
}
