# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY app/ .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main main.go

# Run stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates nginx

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/files /app/files

# Create directories
RUN mkdir -p /var/www/html /app/files

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/http.d/default.conf

# Copy static files
COPY nginx/ /var/www/html/

# Expose ports
EXPOSE 80 8080

# Create startup script
RUN echo '#!/bin/sh\n\
mkdir -p /app/files\n\
nginx &\n\
exec /app/main\n' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
