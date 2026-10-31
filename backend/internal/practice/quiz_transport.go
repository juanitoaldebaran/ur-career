package practice

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/juanitoaldebaran/ur-career-backend/internal/auth"
	"github.com/juanitoaldebaran/ur-career-backend/internal/httpx"
)

type QuizHandler struct {
	service *QuizService
}

func NewQuizHandler(service *QuizService) *QuizHandler { return &QuizHandler{service: service} }

func (h *QuizHandler) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("POST /practice/quizzes", authenticate(http.HandlerFunc(h.Create)))
	mux.Handle("POST /practice/quizzes/{id}/submit", authenticate(http.HandlerFunc(h.Submit)))
}

func (h *QuizHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Role string `json:"role"`
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<10)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Role == "" {
		httpx.WriteError(w, http.StatusBadRequest, "role is required")
		return
	}

	session, err := h.service.Create(r.Context(), userID, req.Role)
	switch {
	case err == nil:
		httpx.WriteJSON(w, http.StatusCreated, session)
	case errors.Is(err, ErrRoleNotFound):
		httpx.WriteError(w, http.StatusNotFound, "role not found")
	case errors.Is(err, ErrQuizGeneration):
		httpx.WriteError(w, http.StatusBadGateway, "could not generate quiz, try again")
	default:
		log.Printf("quiz create: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
	}
}

func (h *QuizHandler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	quizID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid quiz id")
		return
	}

	var req struct {
		Answer map[string]int `json:"answers"`
	}

	r.Body = http.MaxBytesReader(w, r.Body, 8<<10)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.service.Submit(r.Context(), userID, quizID, req.Answer)

	switch {
	case err == nil:
		httpx.WriteJSON(w, http.StatusOK, result)
	case errors.Is(err, ErrQuizNotFound):
		httpx.WriteError(w, http.StatusNotFound, "quiz not found")
	case errors.Is(err, ErrQuizSubmitted):
		httpx.WriteError(w, http.StatusConflict, "quiz already submitted")
	default:
		log.Printf("quiz submit: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
	}
}
