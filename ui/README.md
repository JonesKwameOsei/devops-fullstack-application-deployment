# Bookstore UI

React frontend for the Mighty Hands Book Shop. Communicates with the [Flask API](../api/README.md) running on port 5000.

## Requirements

- Node.js 18+
- API running at `http://127.0.0.1:5000` (see [api/README.md](../api/README.md))

## Running locally

**1. Install dependencies**

```bash
cd ui
npm install
```

**2. Start the dev server**

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). The page hot-reloads on file saves.

## Available scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the development server |
| `npm test` | Run the test suite |
| `npm run lint` | Run ESLint across `src/` |
| `npm run build` | Build optimised production bundle to `build/` |

## Pre-commit hooks (shift-left)

Static analysis with [ESLint](https://eslint.org/) runs automatically before every commit, enforcing React best practices and catching bugs before they reach CI.

ESLint is already bundled with `react-scripts` — no extra install needed.

**Install the git hook** (one-time, from the repo root — shared with the API hook):

```bash
pre-commit install
```

**Output:**

```bash
pre-commit installed at .git/hooks/pre-commit
```

From that point on, every `git commit` will run ESLint alongside the API's pyright check:

| Hook | Scope | What it catches |
|------|-------|-----------------|
| `eslint` | `ui/src/**/*.{js,jsx}` | React rule violations, undefined variables, unused imports, hooks misuse |
| `pyright` | `api/` | Python type errors |
| `trailing-whitespace` | all files | Trailing spaces |
| `end-of-file-fixer` | all files | Missing newline at end of file |
| `check-yaml` / `check-json` | all files | Config syntax errors |
| `debug-statements` | Python files | Accidental `pdb`/`breakpoint()` |

**Run lint manually at any time:**

```bash
npm run lint
```

The `--max-warnings 0` flag is set, so warnings are treated as errors — the commit is blocked unless ESLint exits fully clean.

### Baseline result

ESLint was clean on the initial codebase:

```
✔ ESLint passed with 0 errors, 0 warnings
```

The ESLint config extends CRA's `react-app` ruleset (configured in `package.json` under `eslintConfig`) which covers:

- React hooks rules (`exhaustive-deps`, rules of hooks)
- JSX best practices
- No unused variables
- No undefined variables
- Import/export correctness

## Testing

```bash
npm test
```

Runs the test suite once (non-interactive):

```bash
npm test -- --watchAll=false
```

## Production build

```bash
npm run build
```

Outputs an optimised, minified bundle to `build/`. Filenames include content hashes for cache-busting.
