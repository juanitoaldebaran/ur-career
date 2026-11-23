# ---- build stage ----
FROM golang:1.26-alpine AS build
WORKDIR /src

# Copy only the dependency files first so this layer is cached
# until go.mod/go.sum change.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# CGO_ENABLED=0 gives a fully static binary that runs on a bare image.
RUN CGO_ENABLED=0 go build -o /out/api ./cmd/api

# ---- run stage ----
FROM alpine:3.21
# CA certs are needed for HTTPS calls to Gemini and Supabase.
RUN apk add --no-cache ca-certificates
COPY --from=build /out/api /usr/local/bin/api
EXPOSE 8080
CMD ["api"]
