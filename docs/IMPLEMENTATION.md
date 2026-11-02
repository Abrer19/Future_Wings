# Implementation Guide

How FutureWings is put together, and how to add to it without fighting the structure.
For setup and how to run things, see the [root README](../README.md).

## Layers

Four projects, dependencies pointing strictly inward:

```
Domain  <-  Application  <-  Infrastructure  <-  Web
```

| Project | Contains | Rule |
| --- | --- | --- |
| `FutureWings.Domain` | Entity classes only | **Zero dependencies.** No `using` statements at all, not even EF Core. If you need an attribute here, you are modelling in the wrong place |
| `FutureWings.Application` | DTOs, service interfaces | Contracts only. Must never reference EF Core or `Infrastructure` |
| `FutureWings.Infrastructure` | `DbContext`, migrations, seeders, **all** service implementations | Where anything touching the database, network, or a third party lives |
| `FutureWings.Web` | Controllers, SignalR hub, `Program.cs` | Composition root. Thin — no business logic |

**Interfaces live in `Application/Interfaces/`; implementations always live in
`Infrastructure/Services/`** — including stubs. An earlier version of this codebase put
placeholder implementations in `Application/Services/` simply because they had no
database dependency, which made the folder structure signal "not finished yet" rather
than a layering decision. That has been corrected; don't reintroduce it.

## Request flow

Every API request follows the same path:

```
HTTP → Controller → IXService (Application) → XService (Infrastructure) → DbContext → SQL
```

Controllers do four things and nothing else: read the route/body, pull the user id from
JWT claims, call one service method, and map the result to a status code.

```csharp
[Authorize]
[ApiController]
[Route("api/deadlines")]
public class DeadlineController(IDeadlineService deadlineService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await deadlineService.GetAllAsync(GetUserId()));

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
```

Services take `FutureWingsDbContext` directly via primary constructor. There is no
repository or unit-of-work layer — an unused `GenericRepository<T>` existed once and was
deleted. `DbContext` is already both.

## Authentication & Authorization

1. `POST /api/auth/register` — `AuthService.RegisterAsync` normalises the email to
   lowercase, rejects duplicates, hashes the password with BCrypt, and creates the `User`
   plus its `UserProfile` in one `SaveChangesAsync`.
2. **Every public registration creates a `Student` role.** First-user privilege escalation has
   been removed. Administrative accounts cannot be created via public registration.
3. **Safe Local Admin Bootstrapping**: In development environments, local judges and testers can
   explicitly create or promote an admin account via `POST /api/auth/bootstrap-admin` (which is
   inaccessible in Production) or by launching with `FUTUREWINGS_SEED_STAFF=true`.
4. **Rate Limiting**: Built-in ASP.NET Core rate limiting (`auth-policy`, 10 requests per minute)
   protects `POST /api/auth/register` and `POST /api/auth/login` against brute force attempts.
5. Onboarding deadlines are seeded immediately after the user is persisted, guarded by
   the `User.HasSeededDeadlines` flag. See [DATABASE.md](DATABASE.md#seeding).
6. `JwtTokenService` issues an HS256 token with `NameIdentifier`, `Email`, `Role`, `Jti`,
   valid for **1 hour**.

The signing key comes from `Jwt:Secret` (user-secrets in Development, `Jwt__Secret` env
var in Production). `Program.cs` throws at startup if it is missing — a misconfigured
machine fails loudly rather than signing with a weak key.

Authorisation is claims-based: protected controllers derive the user id from
`ClaimTypes.NameIdentifier`, **never** from a route or query parameter, and services
scope every query by that id. `DeadlineService`, for instance, filters on
`item.UserId == userId`, so one user touching another's row returns `404`, not `403`
(deliberate — it does not confirm the row exists).

## Document Storage & Persistence

Document uploads enforce strict multi-layer security:
- **Magic Bytes Validation**: Uploaded files must match their declared extension and valid binary signatures (`%PDF` for PDF, `\x89PNG` for PNG, `\xFF\xD8\xFF` for JPEG, `\xD0\xCF\x11\xE0` for DOC, `PK\x03\x04` for DOCX). Mismatched MIME types or spoofed file extensions are rejected.
- **Path Traversal Protection**: Uploaded file names are strictly sanitized with `Path.GetFileName` and stored on disk under randomly generated GUID identifiers (`{Guid:N}{ext}`). The physical path is validated to remain inside the canonical storage directory.
- **Atomic Operations & Cleanup**: If database persistence fails during an upload, the written file is automatically removed. When a document is deleted, the database row and physical file are both purged.
- **Persistence Across Restarts**: Stored documents reside in `App_Data/documents` by default, configurable via `DocumentStorage:Path` (`DocumentStorage__Path` env var). In Docker deployments, this path is mounted to the named volume `document-data:/app/App_Data/documents`.

## Student Academic Profile Completion & Feature Gating

Accurate study-abroad features (such as personalized AI program recommendations, the interactive study roadmap knowledge graph, and scholarship eligibility matching) strictly depend on complete student academic data.

### Four Required Academic Core Fields
Profile completeness for students is determined by exactly four core fields:
1. **CGPA**: Numeric score between `0.0` and `4.0` (out of 4.0 scale).
2. **Target Academic Major**: Non-empty trimmed string representing intended major.
3. **Annual Tuition & Living Budget (USD)**: Numeric liquid funds strictly greater than zero (`> 0`).
4. **Target Degree Level**: Valid selected degree level (`Bachelor's`, `Master's`, `PhD`, `Diploma`, `Certificate`).

> First Name and Last Name are validated on the personal profile form, but the four academic fields above govern academic readiness and feature gating.

### Server-Side Source of Truth
- `GET /api/profile` dynamically evaluates profile completeness on the server and returns:
  - `isAcademicComplete` (boolean)
  - `completedCoreFieldsCount` (integer, 0 to 4)
  - `totalRequiredCoreFieldsCount` (`4`)
  - `missingCoreFields` (list of missing field names, e.g. `["Target Major", "Annual Budget"]`)
  - `completionPercentage` (`0` to `100%`)
- Profile queries and updates are strictly scoped by the authenticated JWT `NameIdentifier` claim, preventing cross-user profile access.

### Onboarding Flow & Escape Paths
1. **Onboarding Prompt**: Upon student login, if the profile is incomplete, a prominent prompt dialog (`ProfileCompletionPrompt`) informs the student why profile completion matters and displays a 4-field milestone progress tracker.
2. **Temporary Skip Path**: Students can click **Skip for Now** without permanently blocking general browsing. The dismissal is saved per-session in `sessionStorage` and displays a persistent inline warning banner (`ProfileIncompleteBanner`). The prompt returns on the next session if the profile remains incomplete.
3. **Sidebar Action**: When the profile is incomplete, the sidebar account area displays `Complete Your Profile (X/4)` before `Take Product Tour`. Once complete, the standard `Take Product Tour` action is shown.
4. **Exemption for Privileged Roles**: Admin and Agent roles are not students and are never prompted or gated by the student profile requirement.
5. **Feature Gating**:
   - **Recommendations**: Displays a dedicated profile-required state explaining the missing fields with a direct link to Profile.
   - **Roadmap / Knowledge Graph**: Highlights missing core milestones with gap nodes and displays an advisory banner.
   - **Scholarships**: Shows all general funding opportunities with a notice that personalized matching requires profile completion. General search, deadlines, and tracking remain fully operational.

## Subscriptions, Stripe & Idempotency

- **Judge Demo Simulation**: Simulated upgrade is enabled only in Development when `FUTUREWINGS_DEMO_MODE=true` or demo keys are used. Simulated checkouts are strictly rejected in Production or whenever a real Stripe secret key is configured.
- **Return URL Validation**: Return URLs passed to Stripe checkout must be well-formed HTTP/HTTPS URLs matching configured frontend origins (`Cors:AllowedOrigins` or `CORS_ALLOWED_ORIGINS`). Arbitrary external redirect targets are rejected.
- **Webhook Idempotency**: Stripe webhook events are tracked in the database (`ProcessedWebhookEvents` table). Replayed `checkout.session.completed` events do not create duplicate payments or reapply state.
- **Metadata Verification**: The webhook verifies `userId`, `tier`, and `session.SubscriptionId` before granting access.

## Judge Demo & Production Deployment

### 1. Judge Demo Mode (Local Testing)
To run with pre-seeded judge data and simulated payments:
```bash
# Run in Development mode with demo flag:
export ASPNETCORE_ENVIRONMENT=Development
export FUTUREWINGS_DEMO_MODE=true

# Optional: seed privileged Admin and Agent demo accounts:
export FUTUREWINGS_SEED_STAFF=true
```
Pre-seeded credentials for local evaluation:
- **Student Demo**: `demo@futurewings.io` / `Password123!` (Pre-configured Pro tier, active applications, deadlines, documents, and notifications)
- **Admin Demo** (when staff seeded): `admin@futurewings.io` / `Password123!`
- **Agent Demo** (when staff seeded): `agent@futurewings.io` / `Password123!`

### 2. Production Deployment
In production, demo mode and simulated checkout are strictly forbidden:
- `ASPNETCORE_ENVIRONMENT=Production`
- `FUTUREWINGS_DEMO_MODE=false` (or unset)
- `CORS_ALLOWED_ORIGINS=https://app.futurewings.io`
- `DocumentStorage__Path=/app/App_Data/documents` (backed by persistent block storage or volume)
- Set real `Stripe__SecretKey`, `Stripe__PublishableKey`, and `Stripe__WebhookSecret`.
- Reverse Proxy: FutureWings API runs on HTTP port 5002 inside Docker. In production, place it behind a TLS-terminating reverse proxy (such as Nginx, Traefik, or AWS ALB) that provides SSL/TLS certificates and forwards `X-Forwarded-For` and `X-Forwarded-Proto` headers.

## Dependency injection

All registrations are in `Program.cs`, all `Scoped`:

```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDeadlineService, DeadlineService>();
// ...one line per interface
```

`JwtTokenService`, `PasswordHasherService`, and `StripePaymentService` are registered as
concrete types (no interface). `GeminiAiService` uses `AddHttpClient<>`.

## Error handling

The API is JSON-only and returns RFC 7807 problem details everywhere:

```csharp
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
app.UseStatusCodePages();
```

Controllers translate known domain exceptions to status codes themselves —
`InvalidOperationException` → `409`, `ArgumentException` → `400`,
`UnauthorizedAccessException` → `401`.

## Frontend

React 19 + Vite + Tailwind, plain JSX. No router, no state library, no TypeScript.

```
ClientApp/src/
  App.jsx            Shell, auth gate, page switching (useState, not a router)
  auth.js            Session storage + the shared fetch wrapper
  pages/             One file per nav destination
  components/
    auth/            Login/Register form primitives
    dashboard/       Deadline dashboard pieces
    home/            Public homepage sections
```

- `App.jsx` renders `<Home />` when signed out, the workspace when signed in, and filters
  the `Admin` nav item by `session.role`.
- `auth.js` owns the token: `apiRequest(path, { token, ...options })` attaches
  `Authorization: Bearer`. Every call site passes the token explicitly.
- **Design tokens** are in `tailwind.config.js` — `primary` `#ff6b3d`, `secondary`
  `#51607a`, `accent`, `success`, `warning`, `danger`, `surface`. Use the named
  utilities (`bg-primary-500`), not arbitrary hex.
