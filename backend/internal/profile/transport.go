package profile

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/juanitoaldebaran/ur-career-backend/internal/auth"
)

type Handler struct {
	service *Service
}

type ProfileResponse struct {
	UserID      string    `json:"user_id"`
	CurrentRole string    `json:"current_role"`
	TargetRole  string    `json:"target_role"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UpdateProfileResquest struct {
	CurrentRole string         `json:"current_role"`
	TargetRole  string         `json:"target_role"`
	Constraints map[string]any `json:"constraints"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux, authenticate func(http.Handler) http.Handler) {
	mux.Handle("GET /profile", authenticate(http.HandlerFunc(h.GetProfile)))
	mux.Handle("PATCH /profile", authenticate(http.HandlerFunc(h.UpdateProfile)))
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	profile, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrProfileNotFound) {
			writeError(w, http.StatusNotFound, "profile not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, ProfileResponse{
		UserID:      profile.UserID.String(),
		CurrentRole: profile.CurrentRole,
		TargetRole:  profile.TargetRole,
		UpdatedAt:   profile.UpdatedAt,
	})
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var updateProfileReq UpdateProfileResquest
	if err := json.NewDecoder(r.Body).Decode(&updateProfileReq); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	profile, err := h.service.UpdateProfile(r.Context(), userID, updateProfileReq.CurrentRole, updateProfileReq.TargetRole, updateProfileReq.Constraints)
	if err != nil {
		switch {
		case errors.Is(err, ErrCurrentRoleIsReq), errors.Is(err, ErrTargetRoleIsReq):
			writeError(w, http.StatusBadRequest, err.Error())
		default:
			writeError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	writeJSON(w, http.StatusOK, ProfileResponse{
		UserID:      profile.UserID.String(),
		CurrentRole: profile.CurrentRole,
		TargetRole:  profile.TargetRole,
		UpdatedAt:   profile.UpdatedAt,
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
