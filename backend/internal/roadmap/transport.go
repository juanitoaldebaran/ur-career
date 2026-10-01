package roadmap

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

type NodeResponse struct {
	ID       uuid.UUID  `json:"id"`
	ParentID *uuid.UUID `json:"parent_id"`
	Title    string     `json:"title"`
	Position int        `json:"position"`
	Status   string     `json:"status"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /roadmaps", authenticate(http.HandlerFunc(h.ListRoadmaps)))
	mux.Handle("GET /roadmap/{slug}", authenticate(http.HandlerFunc(h.GetNodes)))
	mux.Handle("PATCH /roadmap/nodes/{id}/progress", authenticate(http.HandlerFunc(h.UpdateStatus)))
}

func (h *Handler) ListRoadmaps(w http.ResponseWriter, r *http.Request) {
	roadmaps, err := h.service.ListRoadmaps(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, roadmaps)
}

func (h *Handler) GetNodes(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	slug := r.PathValue("slug")

	nodeLists, err := h.service.GetNodes(r.Context(), userID, slug)
	if err != nil {
		if errors.Is(err, ErrRoadmapNotFound) {
			httpx.WriteError(w, http.StatusNotFound, "roadmap not found")
			return
		}
		log.Printf("roadmap: GetNodes(%q): %v", slug, err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	nodeResponse := make([]NodeResponse, len(nodeLists))
	for i, node := range nodeLists {
		nodeResponse[i] = NodeResponse{
			ID:       node.ID,
			ParentID: node.ParentID,
			Title:    node.Title,
			Position: node.Position,
			Status:   node.Status,
		}
	}

	httpx.WriteJSON(w, http.StatusOK, nodeResponse)
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	nodeID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid node id")
		return
	}

	var updateStatusRequest UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&updateStatusRequest); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.service.UpdateStatus(r.Context(), userID, nodeID, updateStatusRequest.Status); err != nil {
		if errors.Is(err, errInvalidStatus) {
			httpx.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, "status has been updated")
}
