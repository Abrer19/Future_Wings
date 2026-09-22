# FutureWings

![Continuous Integration](https://github.com/Abrer19/Future_Wings/actions/workflows/ci.yml/badge.svg)
![.NET 8](https://img.shields.io/badge/.NET-8.0-purple.svg)
![React 19](https://img.shields.io/badge/React-19-blue.svg)
![Tests](https://img.shields.io/badge/Tests-86%20Passed-success.svg)

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

> **Admin Account Promotion**: `AuthService.RegisterAsync` automatically assigns the **Admin** role to the first user created in the database. Subsequent registrations default to **Student**.

### 2. Frontend Setup (React 19 + Vite)
In a second terminal:
```powershell
cd ClientApp
npm install
npm run dev
```
Open <http://localhost:5173>. Vite automatically proxies `/api` calls to the backend on port `5002`.

---

## 🧪 Automated Testing

The solution includes a comprehensive unit test suite running against in-memory database providers and testing cryptographic/token security:

```powershell
dotnet test
```

### Test Coverage (86 Tests)
- **Controllers & Integration**: WebApplicationFactory integration tests verifying authentication, authorization, and endpoint schemas.
- **Authentication & Security**: Token claim injection, role authorization, BCrypt password hashing & salt verification.
- **Applications & Tracking**: Multi-status workflow (`Draft`, `Submitted`, `Under Review`, `Accepted`, `Withdrawn`), user isolation, deduplication constraints, deletion.
- **Deadlines & Planner**: Task creation, category classification, completion toggles, removal.
- **Student Profile**: Academic details, GPA, budget, major, and degree-level persistence.
- **Discovery Catalog & Bookmarks**: Query matching, country/degree filters, saved program toggles.
- **Recommendations Engine**: Multi-factor ranking engine (academic fit, budget match, and personalized explanations).
- **Documents Vault**: File upload validation, content-type verification, metadata persistence, and deletion.
- **Scholarships & Reviews**: Filtered catalog queries, rating score clamping (1–5), university review retrieval.
- **Visa Risk Calculator**: Deterministic preparation heuristic scoring, financial coverage checking, IELTS benchmarking.
- **Administration & Billing**: Role management, tier assignment, demo checkout session creation, and MRR calculations.

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

---

## 📊 Feature Status Matrix

| Module | Status | Highlights |
| :--- | :---: | :--- |
| **Authentication & Security** | ✅ Complete | JWT tokens, BCrypt hashing, role-based claims, auto 401 interceptor |
| **Applications Tracker** | ✅ Complete | Full lifecycle management, stage filters, Discovery catalog integration |
| **Deadlines & Planner** | ✅ Complete | Interactive task manager, completion toggling, 7 onboarding seed tasks |
| **Discovery Catalog** | ✅ Complete | Global university search, country/degree filters, shortlist bookmarks |
| **Document Vault** | ✅ Complete | Authenticated file storage (PDF, Word, images) with size & type guards |
| **Recommendation Engine** | ✅ Complete | Multi-factor matching engine based on GPA, budget, and major alignment |
| **Student Profile & Roadmap** | ✅ Complete | Academic details, ReactFlow curriculum graph, step progress calculation |
| **AI Mock Interview** | ✅ Complete | MediaPipe camera framing checks & speech answer scoring |
| **Subscriptions & Billing** | ✅ Complete | Tier entitlements, simulated checkout & Stripe webhook verification |
| **Admin Operations** | ✅ Complete | User management, role elevation & demotion guards, platform telemetry |
| **Community & Reviews** | ⏳ In Progress | University review ratings and feedback |
| **Scholarships Directory** | ⏳ In Progress | International funding search and deadline link |
| **Visa Risk Assessment** | ✅ Implemented | Owner-scoped application report and interactive evidence checklist |

---

## 🔒 Security Hardening

- **User-Scoped Security**: All student endpoints strictly extract the user ID from authenticated JWT claims (`ClaimTypes.NameIdentifier`) — route parameters are never trusted for user identity.
- **Session Auto-Recovery**: The frontend interceptor detects expired tokens (`401 Unauthorized`), purges cached storage, and cleanly redirects users to sign in.
- **File Upload Safeguards**: Multi-part document uploads enforce a strict 10 MB limit and allow only whitelisted MIME types (`PDF`, `DOCX`, `JPEG`, `PNG`).
