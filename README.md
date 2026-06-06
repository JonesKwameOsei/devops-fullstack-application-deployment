# Mighty Hands 💪 Book Shop

A full-stack bookstore web application built as a DevOps project. The project follows a shift-left approach, embedding quality gates from the very first commit and progressing through containerisation and beyond.

![full-ui](images/full-ui-with-api.png)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Application Development Locally](#application-development-locally)
  - [Prerequisites](#prerequisites)
  - [Running the API](#running-the-api)
  - [Running the Frontend](#running-the-frontend)
  - [Application in Action](#application-in-action)
- [Shift-Left Quality Approach](#shift-left-quality-approach)
  - [Pre-commit Hooks](#pre-commit-hooks)
  - [Hook Setup](#hook-setup)
  - [Bugs Caught Before Commit](#bugs-caught-before-commit)
- [Containerisation](#containerisation)
  - [Dockerfile Best Practices Applied](#dockerfile-best-practices-applied)
  - [Authenticate with GitHub Container Registry](#authenticate-with-github-container-registry)
  - [Build the API Image](#build-the-api-image)
  - [Run the Container Locally](#run-the-container-locally)
  - [Tag and Push to GHCR](#tag-and-push-to-ghcr)
  - [Pull and Run Image from GHCR](#pull-and-run-image-from-ghcr)
- [Containerise Frontend UI](#containerise-frontend-ui)
  - [Dockerfile Best Practices Applied](#dockerfile-best-practices-applied-1)
  - [Build the UI Image](#build-the-ui-image)
  - [Run the Container Locally](#run-the-container-locally-1)
  - [Tag and Push to GHCR](#tag-and-push-to-ghcr-1)
  - [Pull and Run Image from GHCR](#pull-and-run-image-from-ghcr-1)

---

## Project Overview

Mighty Hands Book Shop is a browsable online bookstore serving a curated catalogue of classic and modern literature. Users can browse books by category, view product details, add items to a shopping cart, and proceed to checkout.

The application is composed of two services that run alongside each other:

| Service | Technology | Port |
|---------|------------|------|
| Frontend | React 19 | 3000 |
| API | Python Flask | 5000 |

---

## Tech Stack

**Frontend**
- React 19, React Router v7
- CSS (custom, no UI framework)
- ESLint (react-app ruleset)

**Backend**
- Python 3.13, Flask 2.2, Flask-CORS
- psycopg — PostgreSQL driver (wired for database integration)

**Quality & DevOps**
- `pyright` — static type checking for Python
- `eslint` — static analysis for JavaScript / JSX
- `pre-commit` — enforces quality gates on every commit

---

## Project Structure

```
devops-project-bookstore/
├── api/                     # Flask REST API
│   ├── main.py
│   ├── requirements.txt     # includes pyright and pre-commit
│   └── pyrightconfig.json
├── ui/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
├── images/
├── .pre-commit-config.yaml  # shared shift-left hook config
└── README.md
```

---

## Application Development Locally

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.10 |
| Node.js | 18  |
| pipx | any |

Both services must run at the same time. The React dev server proxies all `/api` requests to `http://127.0.0.1:5000`.

---

### Running the API

> Full instructions: [api/README.md](api/README.md)

```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

API available at `http://127.0.0.1:5000`

---

### Running the Frontend

> Full instructions: [ui/README.md](ui/README.md)

```bash
cd ui
npm install
npm start
```

App available at `http://localhost:3000`

---

### Application in Action

![bookshop-ui](images/ui-1.png)

**Browsing the catalogue**

![full-ui](images/full-ui2.png)

**Shopping cart**

![shopping-cart](images/shopping-cart.png)

**Adding to cart**

![add-to-cart](images/add-to-cart.png)

---

## Shift-Left Quality Approach

Quality is enforced at the earliest stage of the development cycle — before code is committed. Both services are covered by pre-commit hooks that block a commit if type errors or lint violations are present, meaning bugs are caught locally rather than in CI or code review.

### Pre-commit Hooks

| Hook | Scope | Tool | What it catches |
|------|-------|------|-----------------|
| `pyright` | `api/` | pyright | Python type errors, `None`-safety violations |
| `eslint` | `ui/src/` | ESLint | React rule violations, undefined variables, hooks misuse |
| `trailing-whitespace` | all files | pre-commit-hooks | Trailing spaces |
| `end-of-file-fixer` | all files | pre-commit-hooks | Missing newline at end of file |
| `check-yaml` / `check-json` | all files | pre-commit-hooks | Config syntax errors |
| `debug-statements` | Python files | pre-commit-hooks | Accidental `pdb` / `breakpoint()` left in code |

Hook configuration: [.pre-commit-config.yaml](.pre-commit-config.yaml)

---

### Hook Setup

Install `pre-commit` and `pyright` globally via pipx (one-time per machine):

```bash
pipx install pre-commit
pipx install pyright
```

Install all dependencies, then wire up the git hook from the repo root:

```bash
pip install -r api/requirements.txt
cd ui && npm install && cd ..
pre-commit install
```

Output:

```
pre-commit installed at .git/hooks/pre-commit
```

---

### Bugs Caught Before Commit

On the first run, pyright surfaced a `None`-safety violation in the Flask API — `request.json` is typed as `Any | None` and calling `.get()` on it without a null check would crash at runtime on any malformed request:

![pre-commit-error](images/pre-commit-error.png)

After fixing both affected route handlers (`add_to_cart`, `update_cart`) to use `request.get_json(silent=True) or {}`, all hooks pass:

![pre-commit-fixed](images/pre-commit-errors-fixed.png)

ESLint also runs on every commit against the React source, blocking any lint violation before it reaches the codebase:

![eslint-pass](images/eslint-pass.png)

For the full root-cause analysis see [api/README.md → Bugs caught on first run](api/README.md#bugs-caught-on-first-run).

---

## Containerisation

Both services are containerised using hardened, production-ready Docker images and published to the GitHub Container Registry (GHCR). All Dockerfiles follow Docker and Sysdig best practices throughout.

### Dockerfile Best Practices Applied

| Practice | Implementation |
|----------|---------------|
| Multi-stage build | `builder` stage compiles deps; `runtime` stage carries only the app and venv |
| Non-root user | `appuser` system account with no login shell — process never runs as root |
| Trusted, pinned base image | `python:3.13-slim` — official image, specific version tag |
| Minimal attack surface | Build tools (`gcc`, `libpq-dev`) stay in the builder stage only |
| No dev dependencies | `pre-commit` and `pyright` live in `requirements-dev.txt` and are excluded from the image |
| COPY over ADD | No `ADD` instruction used |
| `.dockerignore` | Excludes `venv/`, `__pycache__/`, dev config files from the build context |
| Pinned apt versions | All `apt-get install` packages pinned by version |
| OCI metadata labels | Full label block: title, description, version, author, source, licence |
| HEALTHCHECK | Polls `/api/categories` every 30 s; container reports `healthy`/`unhealthy` |
| Production server | `gunicorn` replaces Flask's built-in dev server |
| Hadolint | Linted to zero warnings before pushing |

Dockerfile: [api/Dockerfile](api/Dockerfile) — `.dockerignore`: [api/.dockerignore](api/.dockerignore)

---

### Authenticate with GitHub Container Registry

Access to GHCR requires a Personal Access Token (PAT). Generate one at:

**GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)**

Assign the following scopes:
- `write:packages` — push images
- `read:packages` — pull images
- `repo` — required for private repositories

Login with the token:

```bash
echo <YOUR_PAT> | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
```

> In GitHub Actions workflows, use the automatic `secrets.GITHUB_TOKEN` — no PAT management needed. See the CI/CD section for the signing workflow.

---

### Build the API Image

> This project runs `nerdctl + buildkit` on a homelab node, aliased as `docker=sudo nerdctl`.

```bash
docker build -t bookstore-api:1.0.0 ./api
```

Confirm the image:

```bash
docker image ls
```

```
REPOSITORY       TAG      IMAGE ID        CREATED           PLATFORM       SIZE       BLOB SIZE
bookstore-api    1.0.0    2dd9e2d7c16b    2 minutes ago     linux/amd64    171.1MB    55.07MB
```

---

### Run the Container Locally

```bash
docker run -d --network host --name bookstore-api bookstore-api:1.0.0
```

Test it:

```bash
curl http://127.0.0.1:5000/api/products/1
```

```json
{"author":"Leo Tolstoy","category":"Classics","id":"1","name":"War and Peace","price":24.99,...}
```

> **Note on networking:** This node uses Cilium CNI for Kubernetes. nerdctl port mapping (`-p`) does not work with Cilium — use `--network host` for local testing, or curl the container IP directly (`docker inspect <id>` to find it).

Check health status:

```bash
docker ps
# STATUS: Up X minutes (healthy)
```

---

### Tag and Push to GHCR

Tag the local image with the full registry path:

```bash
docker tag bookstore-api:1.0.0 ghcr.io/joneskwameosei/bookstore-api:1.0.0
```

Confirm tag image:

```bash
docker image ls
```

**Outout**:

```bash
REPOSITORY                              TAG      IMAGE ID        CREATED           PLATFORM       SIZE       BLOB SIZE
ghcr.io/joneskwameosei/bookstore-api    1.0.0    2dd9e2d7c16b    41 minutes ago    linux/amd64    171.1MB    55.07MB
bookstore-api                           1.0.0    2dd9e2d7c16b    2 hours ago       linux/amd64    171.1MB    55.07MB
```

Push to GHCR:

```bash
docker push ghcr.io/joneskwameosei/bookstore-api:1.0.0
```

The image is published at: `ghcr.io/joneskwameosei/bookstore-api:1.0.0`

![ghcr-package](images/ghcr-image-v1.png)

### Pull and Run Image from GitHub Registry

Now remove local images, pull and run image from the registry:

Remove local images

```bash
docker image rm bookstore-api:1.0.0
docker image rm ghcr.io/joneskwameosei/bookstore-api:1.0.0
```

Confirm images are removed

```bash
docker image ls -q | wc -l
```

**Output**:

```bash
0
```

Pull image:

```bash
docker image pull ghcr.io/joneskwameosei/bookstore-api:1.0.0
```

![pulled-image](images/pulled-image.png)

```bash
docker image ls -q | wc -l
docker image ls
```

**Output**:

```bash
1

REPOSITORY                              TAG      IMAGE ID        CREATED          PLATFORM       SIZE       BLOB SIZE
ghcr.io/joneskwameosei/bookstore-api    1.0.0    2dd9e2d7c16b    4 minutes ago    linux/amd64    171.1MB    55.07MB
```

Run pulled image:

```bash
docker container run -d --network=host --name bookstore-api ghcr.io/joneskwameosei/bookstore-api:1.0.0
```

confirm container is running:

```bash
curl http://127.0.0.1:5000/api/products/1
```

**Output**:

```bash
{"author":"Leo Tolstoy","category":"Classics","categoryId":"classics","description":"War and Peace is a novel by Leo Tolstoy, published in 1869. It is regarded as one of Tolstoy's finest literary achievements and remains an internationally praised classic of world literature.","id":"1","imageUrl":"/images/books/war-and-peace-leo-tolstoy.jpg","name":"War and Peace","pages":1225,"price":24.99,"published":1869}
```

```bash
docker container ls
```

**Output**:

```bash

CONTAINER ID    IMAGE                                         COMMAND                   CREATED          STATUS    PORTS    NAMES
cab61cf8d0d7    ghcr.io/joneskwameosei/bookstore-api:1.0.0    "gunicorn --bind 0.0…"    2 minutes ago    Up                 bookstore-api
```

## Containerise Frontend UI

The React UI is served in production by **nginx** inside a multi-stage Docker image. The builder stage produces the optimised static bundle; the runtime stage is a minimal nginx image with no Node.js or build tooling.

### Dockerfile Best Practices Applied

| Practice | Implementation |
|----------|---------------|
| Multi-stage build | `node:22-alpine` builder → `nginx:1.27-alpine` runtime |
| Non-root user | `nginx` user (uid 101, pre-created in the image) — port 8080 requires no root |
| Trusted, pinned base image | `node:22-alpine` and `nginx:1.27-alpine` — no `latest` tag |
| Reproducible install | `npm ci` reads `package-lock.json` — all versions exactly pinned |
| Layer caching | `package.json` / `package-lock.json` copied before source — deps layer survives code-only changes |
| Minimal runtime image | Final image contains only nginx and the static build — no Node.js |
| COPY over ADD | No `ADD` instruction used |
| `.dockerignore` | Excludes `node_modules/`, `build/`, env files from the build context |
| OCI metadata labels | Full label block: title, description, version, author, source, licence |
| HEALTHCHECK | `wget` polls `localhost:8080` every 30 s |
| Custom nginx config | SPA routing (`try_files`), long-lived cache headers, gzip, non-root temp paths |
| Hadolint | Linted to zero warnings before pushing |

Dockerfile: [ui/Dockerfile](ui/Dockerfile) — nginx config: [ui/nginx.conf](ui/nginx.conf) — `.dockerignore`: [ui/.dockerignore](ui/.dockerignore)

---

### Build the UI Image

```bash
docker image build -t bookstore-ui:1.0.0 .
```

Image built successfully:

```bash
[+] Building 38.8s (15/15)
[+] Building 38.9s (15/15) FINISHED
Loaded image: docker.io/library/bookstore-ui:1.0.0
```

Confirm the image:

```bash
docker image ls
```

```bash
REPOSITORY       TAG      IMAGE ID        CREATED           PLATFORM       SIZE       BLOB SIZE
bookstore-ui     1.0.0    <image-id>      2 minutes ago     linux/amd64    <size>     <blob-size>
bookstore-api    1.0.0    <image-id>    X hours ago       linux/amd64    171.1MB    55.07MB
```

---

### Run the Container Locally

```bash
docker container run -d --network host --name bookstore-ui bookstore-ui:1.0.0
```

Test it:

```bash
curl -I http://127.0.0.1:8080
```

Api responded with the code: 200 OK

```bash
HTTP/1.1 200 OK
Server: nginx/1.2x.x
Date: Sat, 06 Jun 2026 19:33:27 GMT
Content-Type: text/html
```

Check health status:

```bash
docker container ls
# STATUS: Up X minutes (healthy)
```

App is healthy:

```bash
ONTAINER ID    IMAGE                                         COMMAND                   CREATED          STATUS    PORTS    NAMES
0156df522dftfd    docker.io/library/bookstore-ui:1.0.0          "/docker-entrypoint.…"    5 minutes ago    Up                 bookstore-ui
```

> **Note on networking:** As with the API, we will utilise `--network host` on this Cilium node. The UI runs on port **8080** (nginx configured as non-root — port 80 requires root).

![ui-local](images/run-ui-locally.png)
---

### Tag and Push to GHCR

Tag with the full registry path:

```bash
docker image tag bookstore-ui:1.0.0 ghcr.io/joneskwameosei/bookstore-ui:1.0.0
```

Confirm both tags:

```bash
docker image ls
```

```
REPOSITORY                             TAG      IMAGE ID     CREATED          PLATFORM       SIZE
ghcr.io/joneskwameosei/bookstore-ui    1.0.0    <image-id>   X minutes ago    linux/amd64    <size>
bookstore-ui                           1.0.0    <image-id>   X minutes ago    linux/amd64    <size>
```

Push to GHCR:

```bash
docker push ghcr.io/joneskwameosei/bookstore-ui:1.0.0
```

The image is published at: `ghcr.io/joneskwameosei/bookstore-ui:1.0.0`

![ghcr-ui-package](images/ui-ghcr-1.png)
![ghcr-ui-package](images/ui-ghcr-2.png)

---

### Pull and Run Image from GHCR

Remove local images:

```bash
docker image rm bookstore-ui:1.0.0
docker image rm ghcr.io/joneskwameosei/bookstore-ui:1.0.0
```

Confirm removed:

```bash
docker image ls -q | wc -l
```

**Output**:

```bash
0
```

Pull from registry:

```bash
docker image pull ghcr.io/joneskwameosei/bookstore-ui:1.0.0
```

**Output**:

```bash
Completed pull from OCI Registry (ghcr.io/joneskwameosei/bookstore-ui:1.0.0)    elapsed: 1.5 s  total:  22.9 M  (15.4 MiB/s)
```

Run the pulled image:

```bash
docker container run -d --network host --name bookstore-ui ghcr.io/joneskwameosei/bookstore-ui:1.0.0
```

Confirm it is serving:

```bash
curl -I http://127.0.0.1:8080
```

```bash
HTTP/1.1 200 OK
Server: nginx/1.27.x
Content-Type: text/html
```

Confirm container is running:

```bash
docker container ls
```

```bash
CONTAINER ID    IMAGE                                        COMMAND                   CREATED               STATUS    PORTS    NAMES
<id>     ghcr.io/joneskwameosei/bookstore-ui:1.0.0    "/docker-entrypoint.…"    About a minute ago              Up            bookstore-ui
```

## Deploying Frontend UI and Backend API in Kubernetes
