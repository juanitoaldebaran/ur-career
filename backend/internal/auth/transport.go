package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /auth/register", h.Register)
	mux.HandleFunc("POST /auth/login", h.Login)
	mux.HandleFunc("POST /auth/logout", h.Logout)
	mux.Handle("GET /auth/me", h.Authenticate(http.HandlerFunc(h.Me)))
}

type contextKey string

const claimsContextKey contextKey = "claims"

func (h *Handler) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		const prefix = "Bearer "
		if !strings.HasPrefix(authHeader, prefix) {
			writeError(w, http.StatusUnauthorized, "missing or invalid authorization")
			return
		}

		tokenString := strings.TrimPrefix(authHeader, prefix)
		claims, err := h.service.ParseToken(tokenString)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r RegisterRequest) validate() error {
	if strings.TrimSpace(r.Email) == "" || !strings.Contains(r.Email, "@") {
		return errors.New("a valid email is required")
	}
	if len(r.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}

type RegisterResponse struct {
	Id        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r LoginRequest) validate() error {
	if strings.TrimSpace(r.Email) == "" {
		return errors.New("email is required")
	}
	if r.Password == "" {
		return errors.New("password is required")
	}
	return nil
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (r LogoutRequest) validate() error {
	if strings.TrimSpace(r.RefreshToken) == "" {
		return errors.New("refresh_token is required")
	}
	return nil
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var registerRequest RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&registerRequest); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := registerRequest.validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	users, err := h.service.Register(r.Context(), registerRequest.Email, registerRequest.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserHasAlreadyExisted):
			writeError(w, http.StatusConflict, err.Error())
		default:
			writeError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	writeJSON(w, http.StatusCreated, RegisterResponse{
		Id:        users.Id.String(),
		Email:     users.Email,
		CreatedAt: users.CreatedAt,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var loginRequest LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := loginRequest.validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	accessToken, refreshToken, err := h.service.Login(r.Context(), loginRequest.Email, loginRequest.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials), errors.Is(err, ErrUserNotFound):
			writeError(w, http.StatusUnauthorized, "invalid credentials")
		default:
			writeError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
	writeJSON(
		w,
		http.StatusOK,
		LoginResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var logoutRequest LogoutRequest
	if err := json.NewDecoder(r.Body).Decode(&logoutRequest); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := logoutRequest.validate(); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.Logout(r.Context(), logoutRequest.RefreshToken); err != nil {
		if !errors.Is(err, ErrRefreshTokenNotFound) {
			writeError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

type MeResponse struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(claimsContextKey).(*Claims)
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	writeJSON(w, http.StatusOK, MeResponse{
		UserID: claims.UserID,
		Email:  claims.Email,
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
