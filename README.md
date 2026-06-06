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

The next phase of this project is containerising both services using Docker and orchestrating them with Docker Compose, making the application fully portable and environment-independent.

Planned work:
- `api/Dockerfile` — containerise the Flask API
- `ui/Dockerfile` — containerise the React frontend with an Nginx server
- `docker-compose.yml` — wire both services together with a shared network
- Environment variable management for service discovery between containers
