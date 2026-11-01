# FutureWings

![Continuous Integration](https://github.com/Abrer19/Future_Wings/actions/workflows/ci.yml/badge.svg)
![.NET 8](https://img.shields.io/badge/.NET-8.0-purple.svg)
![React 19](https://img.shields.io/badge/React-19-blue.svg)
![Tests](https://img.shields.io/badge/Tests-96%20Passed-success.svg)

A modern, full-stack study-abroad planning and application tracking platform. Students discover university programs worldwide, shortlist and compare degrees, manage application lifecycles and deadlines, store essential visa and admission documents, and receive personalized AI-driven program recommendations. Administrators have an operations console for managing users and monitoring platform activity.

**Stack** — .NET 8 Web API with Entity Framework Core on SQL Server, paired with a modern React 19 + Vite + Tailwind CSS single-page application in `ClientApp/`.

---

## 📚 Documentation

| Document | Description |
| --- | --- |
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Clean architecture rules, request flows, authentication, DI, and end-to-end feature guides |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema design, migrations history, reference seeders, and EF Core commands |
| [ClientApp/README.md](ClientApp/README.md) | React 19 frontend setup, design tokens, and state management |
| [SECURITY.md](SECURITY.md) | Vulnerability disclosure policy and security architecture guarantees |

---

## ⚙️ Prerequisites

- **.NET SDK 8.0+**
- **SQL Server / SQL Server Express** (a local `.\SQLEXPRESS` instance connects out-of-the-box with Windows Authentication)
- **Node.js 18+** & **npm**

---

## 🚀 Quick Start

### 1. Backend Setup (.NET 8 Web API)
```powershell
# Restore dependencies
dotnet restore

# Set the JWT signing key (stored securely in user-secrets)
dotnet user-secrets set "Jwt:Secret" "$([Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 })))" --project src/FutureWings.Web

# Run the API (automatically runs migrations and seeds reference data on startup)
dotnet run --project src/FutureWings.Web
```
The API starts on `http://localhost:5002` (and `https://localhost:7189`), with interactive Swagger UI at `http://localhost:5002/swagger`.

> **Authentication Model**: All public registrations strictly create standard **Student** accounts. Privileged **Admin** accounts cannot be created via public registration. For local judging and evaluation, an explicit local bootstrap mechanism (`POST /api/auth/bootstrap-admin`) and demo mode flags are provided.

### 2. Frontend Setup (React 19 + Vite)
In a second terminal:
```powershell
cd ClientApp
npm ci
npm run dev
```
Open <http://localhost:5173>. Vite automatically proxies `/api` calls to the backend on port `5002`.

---

## 🏆 Judge Demo & Local Evaluation

FutureWings includes a gated demo mode designed for evaluators:
- To enable demo mode, run the backend with `FUTUREWINGS_DEMO_MODE=true` (or `DemoMode:Enabled=true` in `appsettings.Development.json`). This flag is strictly rejected in Production.
- **Judge Student Account**:
  - **Email**: `demo@futurewings.io`
  - **Password**: `Password123!`
  - Pre-populated with active applications (TUM, U of T, Stanford, Oxford, ETH Zurich), verified deadlines, uploaded vault documents, and Pro subscription entitlements.
- **Staff Demo Accounts** (Admin / Agent):
  - In Development, set `FUTUREWINGS_SEED_STAFF=true` to seed `admin@futurewings.io` (`Password123!`) and `agent@futurewings.io` (`Password123!`).
- **Simulated Checkout**:
  - In demo mode, upgrading between Free, Pro, and Premium plans runs locally without external network calls. Simulation is strictly rejected in Production or when a live Stripe key is configured.

---

## 🧪 Automated Testing

The solution includes an extensive automated test suite covering unit, cryptographic, security, and integration tests:

### Backend Tests (.NET 8)
```powershell
dotnet test FutureWings.sln
```

### Frontend Tests (Vitest + Testing Library)
```powershell
cd ClientApp
npm test -- --run
```

### Test Coverage (96 Backend Tests + 4 Frontend Tests)
- **Authentication Security**: Privilege escalation prevention (first user cannot become Admin), BCrypt password hashing & salt verification, token claim injection, role-based authorization.
- **Stripe & Subscriptions**: Idempotent webhook processing (replayed Stripe events do not create duplicate payments or corrupt state), invalid return URL rejection, production simulation rejection, live key safety guards.
- **Document Security**: Binary magic byte signatures (`%PDF`, `\x89PNG`, `JPEG`, `DOC`, `DOCX`), MIME spoofing detection, 10 MB size enforcement, path traversal defense, and ownership isolation.
- **Applications & Tracking**: Multi-status workflow (`Draft`, `Submitted`, `Under Review`, `Accepted`, `Withdrawn`), user isolation, deduplication constraints, deletion.
- **Deadlines & Planner**: Task creation, category classification, completion toggles, removal.
- **Student Profile & Recommendation**: Multi-factor ranking engine (academic fit, budget match, and personalized explanations).
- **Visa Risk Assessment**: Deterministic preparation heuristic scoring, financial coverage checking, IELTS benchmarking.

---

## 🐳 Docker & Production Deployment

A complete production-ready `docker-compose.yml` is included:
```powershell
# Copy environment template
cp .env.example .env

# Start database and API
docker compose up -d
```

### Key Deployment Guarantees
- **Persistent Documents Storage**: Document files are stored on a persistent volume mount (`document-data:/app/App_Data/documents`) so uploaded files survive container restarts and can be backed up or attached to cloud storage.
- **Configurable CORS**: Configurable via `CORS_ALLOWED_ORIGINS` environment variable (comma-separated list of approved frontend origins) or `Cors:AllowedOrigins` in `appsettings.json`.
- **Reverse Proxy / HTTPS Setup**: The API container exposes HTTP on port 5002 (`ASPNETCORE_URLS=http://+:5002`). In production, place it behind a TLS-terminating reverse proxy (Nginx, Caddy, Traefik, or AWS ALB) that terminates SSL and passes `X-Forwarded-For` and `X-Forwarded-Proto` headers.

---

## 🏗️ Solution Architecture

```text
Future_Wings/
├── ClientApp/                    # React 19 Single Page Application
│   ├── src/
│   │   ├── components/           # Reusable UI widgets, modals & dashboard cards
│   │   ├── pages/                # Route-level views (Applications, Discovery, Profile, etc.)
│   │   ├── workers/              # Background inference workers (MediaPipe & Transformers)
│   │   ├── auth.js               # Token storage & 401 session interceptor
│   │   └── App.jsx               # Navigation router & app shell
│   └── vite.config.js            # Rollup chunk splitting & API proxying
│
├── src/
│   ├── FutureWings.Domain/       # Pure domain models (Application, Program, University, User, etc.)
│   ├── FutureWings.Application/  # DTOs and service interfaces (Clean Architecture contracts)
│   ├── FutureWings.Infrastructure/ # EF Core DbContext, migrations, seeders & service implementations
│   └── FutureWings.Web/          # ASP.NET Core API controllers, JWT authentication & SignalR hubs
│
└── tests/
    └── FutureWings.Tests/        # In-Memory & security unit test suites
```

Dependencies strictly adhere to Clean Architecture:
$$\text{Domain} \longleftarrow \text{Application} \longleftarrow \text{Infrastructure} \longleftarrow \text{Web}$$
