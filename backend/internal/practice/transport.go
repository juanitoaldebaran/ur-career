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

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /practice/questions", authenticate(http.HandlerFunc(h.ListQuestion)))
	mux.Handle("POST /practice/questions/{id}/attempts", authenticate(http.HandlerFunc(h.Submit)))
}

func (h *Handler) ListQuestion(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "user is not authorized")
		return
	}

	role := r.URL.Query().Get("role")
	if role == "" {
		httpx.WriteError(w, http.StatusBadRequest, "role is required")
		return
	}

	questions, err := h.service.ListQuestion(r.Context(), userID, role)
	if err != nil {
		log.Printf("practice list: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, questions)
}

func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "user is not authorized")
		return
	}

	questionID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid question id")
		return
	}

	var req struct {
		Answer string `json:"answer"`
	}

	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.service.Submit(r.Context(), userID, questionID, req.Answer)
	switch {
	case err == nil:
		httpx.WriteJSON(w, http.StatusOK, result)
	case errors.Is(err, ErrAnswerTooShort), errors.Is(err, ErrAnswerTooLong):
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrQuestionsNotFound):
		httpx.WriteError(w, http.StatusNotFound, "question not found")
	case errors.Is(err, ErrGradingFailed):
		httpx.WriteError(w, http.StatusBadGateway, "grading is unavailable, try again")
	default:
		log.Printf("practice submit: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
	}
}
