package consultation

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/juanitoaldebaran/ur-career-backend/internal/auth"
	"github.com/juanitoaldebaran/ur-career-backend/internal/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler { return &Handler{service: service} }

// UserKey rate-limits per user instead of per IP. Authenticate must run first.
func UserKey(r *http.Request) (string, bool) {
	id, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		return "", false
	}
	return id.String(), true
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux, authenticate, sendLimit func(http.Handler) http.Handler) {
	mux.Handle("POST /consultations", authenticate(http.HandlerFunc(h.Create)))
	mux.Handle("GET /consultations", authenticate(http.HandlerFunc(h.List)))
	mux.Handle("DELETE /consultations/{id}", authenticate(http.HandlerFunc(h.Delete)))
	mux.Handle("GET /consultations/{id}/messages", authenticate(http.HandlerFunc(h.Messages)))
	mux.Handle("POST /consultations/{id}/messages", authenticate(sendLimit(http.HandlerFunc(h.Send))))
}

func userID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
	}
	return id, ok
}

func pathID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid conversation id")
		return uuid.Nil, false
	}
	return id, true
}

func writeErr(w http.ResponseWriter, err error, op string) {
	switch {
	case errors.Is(err, ErrConversationNotFound):
		httpx.WriteError(w, http.StatusNotFound, "conversation not found")
	case errors.Is(err, ErrInvalidCursor):
		httpx.WriteError(w, http.StatusBadRequest, "invalid cursor")
	case errors.Is(err, ErrInvalidMessage):
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrBusy):
		httpx.WriteError(w, http.StatusConflict, "a reply is already being generated")
	case errors.Is(err, ErrModel):
		httpx.WriteError(w, http.StatusBadGateway, "could not get a response, try again")
	default:
		log.Printf("consultation %s: %v", op, err) // never log message content
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
	}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(w, r)
	if !ok {
		return
	}
	conv, err := h.service.Create(r.Context(), uid)
	if err != nil {
		writeErr(w, err, "create")
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, conv)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	page, err := h.service.List(r.Context(), uid, q.Get("cursor"), parseLimit(q.Get("limit")))
	if err != nil {
		writeErr(w, err, "list")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, page)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(w, r)
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := h.service.Delete(r.Context(), uid, id); err != nil {
		writeErr(w, err, "delete")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Messages(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(w, r)
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	page, err := h.service.Messages(r.Context(), uid, id, q.Get("cursor"), parseLimit(q.Get("limit")))
	if err != nil {
		writeErr(w, err, "messages")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, page)
}

// Streams Server-Sent Events: delta* then done, or error.
func (h *Handler) Send(w http.ResponseWriter, r *http.Request) {
	uid, ok := userID(w, r)
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}

	var req struct {
		Content  string `json:"content"`
		Timezone string `json:"timezone"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 32<<10)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rc := http.NewResponseController(w)
	started := false
	event := func(name string, data any) {
		raw, _ := json.Marshal(data)
		fmt.Fprintf(w, "event: %s\ndata: %s\n\n", name, raw)
		rc.Flush()
	}
	start := func() {
		if started {
			return
		}
		started = true
		h := w.Header()
		h.Set("Content-Type", "text/event-stream")
		h.Set("Cache-Control", "no-cache")
		h.Set("X-Accel-Buffering", "no") // stops proxies buffering the stream
		w.WriteHeader(http.StatusOK)
	}

	msg, usage, err := h.service.Send(r.Context(), uid, id, req.Content, req.Timezone, func(text string) {
		start()
		event("delta", map[string]string{"text": text})
	})
	if err != nil {
		if !started {
			writeErr(w, err, "send")
			return
		}
		event("error", map[string]string{"code": "model_unavailable", "message": "the response was cut off"})
		return
	}

	start()
	done := map[string]any{"message_id": msg.ID, "status": msg.Status}
	if usage != nil {
		done["prompt_tokens"] = usage.PromptTokens
		done["completion_tokens"] = usage.CompletionTokens
	}
	event("done", done)
}
