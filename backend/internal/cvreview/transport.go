package cvreview

import (
	"errors"
	"io"
	"log"
	"net/http"

	"github.com/juanitoaldebaran/ur-career-backend/internal/auth"
	"github.com/juanitoaldebaran/ur-career-backend/internal/httpx"
)

const (
	maxFile = 2 << 20              // 2 MB
	maxBody = maxFile + (64 << 10) // room for the multipart overhead
)

type Handler struct{ service *Service }

func NewHandler(service *Service) *Handler { return &Handler{service: service} }

func (h *Handler) RegisterRoutes(mux *http.ServeMux, authenticate, limit func(http.Handler) http.Handler) {
	mux.Handle("POST /cv/reviews", authenticate(limit(http.HandlerFunc(h.Create))))
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "user is not authorized")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBody)
	// maxMemory is as large as the body cap, so nothing spills to a temp file.
	if err := r.ParseMultipartForm(maxBody); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			httpx.WriteError(w, http.StatusRequestEntityTooLarge, "file must be 2 MB or smaller")
			return
		}
		httpx.WriteError(w, http.StatusBadRequest, "invalid upload")
		return
	}
	defer r.MultipartForm.RemoveAll()

	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	if header.Size > maxFile {
		httpx.WriteError(w, http.StatusRequestEntityTooLarge, "file must be 2 MB or smaller")
		return
	}

	pdf, err := io.ReadAll(file)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "could not read file")
		return
	}

	review, err := h.service.Review(r.Context(), userID, pdf, r.FormValue("target_role"))
	switch {
	case err == nil:
		httpx.WriteJSON(w, http.StatusOK, review)
	case errors.Is(err, ErrNotPDF), errors.Is(err, ErrInvalidRole):
		httpx.WriteError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrGradingFailed):
		log.Printf("cv review: %v", err)
		httpx.WriteError(w, http.StatusBadGateway, "grading is unavailable, try again")
	default:
		log.Printf("cv review: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal server error")
	}
}
