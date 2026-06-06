# =============================================================================
# Stage 1 — builder: install dependencies into an isolated venv
# =============================================================================
FROM python:3.13-slim AS builder

WORKDIR /app

# Install build tooling in one layer; clean up apt lists immediately
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc=4:14.2.0-1 libpq-dev=17.10-0+deb13u1 && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip then create the venv
RUN pip install --no-cache-dir pip==25.1.1 && \
    python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements first — Docker cache reuses this layer if unchanged
COPY requirements.txt .

# Install only runtime dependencies — dev tools stay out of the image
RUN pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Stage 2 — runtime: minimal image with no build tools
# =============================================================================
FROM python:3.13-slim AS runtime

# OCI standard labels (sysdig 4.2 / opencontainers spec)
LABEL org.opencontainers.image.title="Bookstore API" \
      org.opencontainers.image.description="Flask REST API for Mighty Hands Book Shop" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="joneskwameosei" \
      org.opencontainers.image.source="https://github.com/joneskwameosei/devops-project-bookstore" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install only the runtime C libraries needed by psycopg (no compiler)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5=17.10-0+deb13u1 && \
    rm -rf /var/lib/apt/lists/*

# Copy the pre-built venv from builder — venv is owned by root (not writable by app)
COPY --from=builder /opt/venv /opt/venv

# Copy application code and set ownership to the non-root user (sysdig 1.4)
COPY --chown=root:root main.py .

# Create a non-root system user with no login shell (sysdig 1.2 / 1.3)
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --no-create-home --shell /usr/sbin/nologin appuser

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 5000

# Health check — polls the categories endpoint every 30 s (sysdig 5.4)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/categories')" \
    || exit 1

# Drop to non-root before the process starts (sysdig 1.2)
USER appuser

# Use gunicorn — flask's built-in server is not safe for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "60", "main:app"]
