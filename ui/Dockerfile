# =============================================================================
# Stage 1 — builder: install dependencies and produce the production bundle
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lockfiles first — Docker cache reuses this layer if unchanged
COPY package.json package-lock.json ./

# Reproducible, exact install (reads package-lock.json — all versions pinned)
RUN npm ci

# Copy source after deps to keep the npm ci layer cached on code-only changes
COPY . .

# Produce the optimised, minified production bundle
RUN npm run build

# =============================================================================
# Stage 2 — runtime: minimal nginx image serving the static bundle
# =============================================================================
FROM nginx:1.27-alpine AS runtime

# OCI standard labels (sysdig 4.2 / opencontainers spec)
LABEL org.opencontainers.image.title="Bookstore UI" \
      org.opencontainers.image.description="React frontend for Mighty Hands Book Shop" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="joneskwameosei" \
      org.opencontainers.image.source="https://github.com/joneskwameosei/devops-project-bookstore" \
      org.opencontainers.image.licenses="MIT"

# Replace default nginx config with our non-root, SPA-routing config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the production build from builder — owned by the nginx user (sysdig 1.4)
COPY --from=builder --chown=nginx:nginx /app/build /usr/share/nginx/html

# Drop to non-root before the process starts (sysdig 1.2 / 1.3)
# nginx user (uid 101) is pre-created in the nginx:alpine image
USER nginx

# Port matches the listen directive in nginx.conf (non-privileged, no root needed)
EXPOSE 8080

# Health check — verifies nginx is serving the app (sysdig 5.4)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
