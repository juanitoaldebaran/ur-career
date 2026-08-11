package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/juanitoaldebaran/ur-career-backend/internal/auth"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, relying on system environment variables")
	}

	dbURL, jwtSecret, port := loadEnvironment()

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	repo := auth.NewPgxRepository(pool)
	service := auth.NewService(repo, jwtSecret, 15*time.Minute)
	handler := auth.NewHandler(service)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func loadEnvironment() (databaseUrl, jwtSecretKey, portValue string) {
	databaseUrl = os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		log.Fatalf("DATABASE_URL is required")
	}

	jwtSecretKey = os.Getenv("JWT_SECRET")
	if jwtSecretKey == "" {
		log.Fatalf("JWT_SECRET is empty")
	}

	portValue = os.Getenv("PORT")
	if portValue == "" {
		log.Fatalf("PORT is empty")
	}

	return databaseUrl, jwtSecretKey, portValue

}
