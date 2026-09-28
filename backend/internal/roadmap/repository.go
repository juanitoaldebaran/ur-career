package roadmap

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrRoadmapNotFound = errors.New("roadmap not found")
)

type Node struct {
	ID       uuid.UUID  `json:"id"`
	ParentID *uuid.UUID `json:"parent_id"`
	Title    string     `json:"title"`
	Position int        `json:"position"`
	Status   string     `json:"status"`
}

type Roadmap struct {
	ID    uuid.UUID `json:"id"`
	Slug  string    `json:"slug"`
	Title string    `json:"title"`
}

type PgxRepository struct {
	db *pgxpool.Pool
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

func (r *PgxRepository) GetRoadmapBySlug(ctx context.Context, slug string) (*Roadmap, error) {
	const query = `
	SELECT id, slug, title
	FROM roadmaps
	WHERE slug = $1
	`

	var roadmap Roadmap
	err := r.db.QueryRow(ctx, query, slug).Scan(
		&roadmap.ID,
		&roadmap.Slug,
		&roadmap.Title,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRoadmapNotFound
		}
		return nil, err
	}

	return &roadmap, nil
}

func (r *PgxRepository) ListNodes(ctx context.Context, roadmapID uuid.UUID) ([]Node, error) {
	const query = `
	SELECT id, parent_id, title, position
	FROM roadmap_nodes
	WHERE roadmap_id = $1
	ORDER BY position
	`

	rows, err := r.db.Query(ctx, query, roadmapID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	nodes := make([]Node, 0)
	for rows.Next() {
		var node Node
		if err := rows.Scan(&node.ID, &node.ParentID, &node.Title, &node.Position); err != nil {
			return nil, err
		}
		nodes = append(nodes, node)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return nodes, nil
}

// GetUserProgress returns node_id -> status for every progress row userID
// has within roadmapID. Nodes with no row here simply aren't in the map --
// the caller treats a missing entry as "pending".
func (r *PgxRepository) GetUserProgress(ctx context.Context, userID, roadmapID uuid.UUID) (map[uuid.UUID]string, error) {
	const query = `
	SELECT p.node_id, p.status
	FROM user_roadmap_progress p
	JOIN roadmap_nodes n ON n.id = p.node_id
	WHERE p.user_id = $1 AND n.roadmap_id = $2
	`

	rows, err := r.db.Query(ctx, query, userID, roadmapID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	progress := make(map[uuid.UUID]string)
	for rows.Next() {
		var nodeID uuid.UUID
		var status string
		if err := rows.Scan(&nodeID, &status); err != nil {
			return nil, err
		}
		progress[nodeID] = status
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return progress, nil
}

func (r *PgxRepository) UpsertProgress(ctx context.Context, userID, nodeID uuid.UUID, status string) error {
	const query = `
	INSERT INTO user_roadmap_progress (user_id, node_id, status)
	VALUES ($1, $2, $3)
	ON CONFLICT (user_id, node_id) DO UPDATE
	SET status = EXCLUDED.status,
	    updated_at = now()
	`

	if _, err := r.db.Exec(ctx, query, userID, nodeID, status); err != nil {
		return err
	}

	return nil
}
