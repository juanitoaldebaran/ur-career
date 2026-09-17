package seed

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type nodeSpec struct {
	Title    string
	Children []nodeSpec
}

type roadmapSpec struct {
	Slug     string
	Title    string
	Sections []nodeSpec
}

type PgxRepository struct {
	db *pgxpool.Pool
}

func NewPgxRepository(db *pgxpool.Pool) *PgxRepository {
	return &PgxRepository{
		db: db,
	}
}

var roadmaps = []roadmapSpec{
	{
		Slug:  "backend-software-engineer",
		Title: "Backend Software Engineer",
		Sections: []nodeSpec{
			{Title: "Internet Basics", Children: []nodeSpec{
				{Title: "How does the Internet work?"},
				{Title: "HTTP/HTTPS"},
				{Title: "DNS"},
				{Title: "Browsers & Hosting basics"},
			}},
			{Title: "Pick a Language", Children: []nodeSpec{
				{Title: "Go"},
				{Title: "Python"},
				{Title: "Node.js"},
				{Title: "Java"},
			}},
			{Title: "Version Control", Children: []nodeSpec{
				{Title: "Git fundamentals"},
				{Title: "GitHub/GitLab workflows"},
			}},
			{Title: "Databases", Children: []nodeSpec{
				{Title: "Relational databases (Postgres/MySQL)"},
				{Title: "NoSQL basics"},
				{Title: "ORMs / query builders"},
			}},
			{Title: "APIs", Children: []nodeSpec{
				{Title: "REST principles"},
				{Title: "Authentication (JWT/OAuth)"},
				{Title: "API testing"},
			}},
			{Title: "Caching & Performance", Children: []nodeSpec{
				{Title: "Caching basics (Redis)"},
				{Title: "Rate limiting"},
			}},
			{Title: "Testing", Children: []nodeSpec{
				{Title: "Unit testing"},
				{Title: "Integration testing"},
			}},
			{Title: "Deployment Basics", Children: []nodeSpec{
				{Title: "Docker"},
				{Title: "CI/CD basics"},
				{Title: "Cloud hosting basics"},
			}},
		},
	},
	{
		Slug:  "cloud-computing",
		Title: "Cloud Computing",
		Sections: []nodeSpec{
			{Title: "Cloud Fundamentals", Children: []nodeSpec{
				{Title: "What is cloud computing?"},
				{Title: "IaaS vs PaaS vs SaaS"},
				{Title: "Public vs Private vs Hybrid cloud"},
			}},
			{Title: "Pick a Cloud Provider", Children: []nodeSpec{
				{Title: "AWS"},
				{Title: "Google Cloud Platform"},
				{Title: "Microsoft Azure"},
			}},
			{Title: "Compute Services", Children: []nodeSpec{
				{Title: "Virtual machines (EC2 / Compute Engine)"},
				{Title: "Containers (Docker, Kubernetes basics)"},
				{Title: "Serverless (Lambda / Cloud Functions)"},
			}},
			{Title: "Storage & Databases", Children: []nodeSpec{
				{Title: "Object storage (S3-style)"},
				{Title: "Managed databases (RDS-style)"},
			}},
			{Title: "Networking Basics", Children: []nodeSpec{
				{Title: "VPCs & Subnets"},
				{Title: "Load balancers"},
				{Title: "DNS & CDN"},
			}},
			{Title: "Security & IAM", Children: []nodeSpec{
				{Title: "Identity & Access Management"},
				{Title: "Security groups / firewalls"},
			}},
			{Title: "Monitoring & Cost Management", Children: []nodeSpec{
				{Title: "Cloud monitoring & logging"},
				{Title: "Cost optimization basics"},
			}},
			{Title: "Infrastructure as Code", Children: []nodeSpec{
				{Title: "Terraform basics"},
				{Title: "CI/CD for cloud deployments"},
			}},
		},
	},
}

func (r *PgxRepository) upsertRoadmap(ctx context.Context, slug, title string) (uuid.UUID, error) {
	const query = `
	INSERT INTO roadmaps (slug, title)
	VALUES ($1, $2)
	ON CONFLICT (slug) DO UPDATE 
	SET title = EXCLUDED.title
	RETURNING id
	`
	var id uuid.UUID
	if err := r.db.QueryRow(ctx, query, slug, title).Scan(&id); err != nil {
		return uuid.Nil, err
	}

	return id, nil
}

func (r *PgxRepository) countNodes(ctx context.Context, roadmapID uuid.UUID) (int, error) {
	const query = `
	SELECT COUNT(*) FROM roadmap_nodes
	WHERE roadmap_id = $1
	`
	var count int
	if err := r.db.QueryRow(ctx, query, roadmapID).Scan(&count); err != nil {
		return 0, err
	}

	return count, nil
}

func (r *PgxRepository) createNodes(ctx context.Context, roadmapID uuid.UUID, parentID *uuid.UUID, title string, position int) (uuid.UUID, error) {
	const query = `
	INSERT INTO roadmap_nodes (roadmap_id, parent_id, title, position)
	VALUES ($1, $2, $3, $4)
	RETURNING id
	`
	var id uuid.UUID
	if err := r.db.QueryRow(ctx, query, roadmapID, parentID, title, position).Scan(&id); err != nil {
		return uuid.Nil, err
	}

	return id, nil
}

// insertTree inserts spec as a node under parentID (nil for a root node),
// then recurses into each child, using the node it just created as that
// child's parent.
func (r *PgxRepository) insertTree(ctx context.Context, roadmapID uuid.UUID, parentID *uuid.UUID, spec nodeSpec, position int) error {
	id, err := r.createNodes(ctx, roadmapID, parentID, spec.Title, position)
	if err != nil {
		return err
	}

	for i, child := range spec.Children {
		if err := r.insertTree(ctx, roadmapID, &id, child, i+1); err != nil {
			return err
		}
	}

	return nil
}
