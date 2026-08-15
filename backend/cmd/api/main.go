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
	service := auth.NewService(repo, jwtSecret, 15*time.Minute, 30*24*time.Hour)
	handler := auth.NewHandler(service)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	log.Printf("listening on :%s", port)
	log.Println("Server has been started successfully")
	if err := http.ListenAndServe(":"+port, corsEnable(mux)); err != nil {
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

func corsEnable(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
