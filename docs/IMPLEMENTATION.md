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

## Authentication

1. `POST /api/auth/register` — `AuthService.RegisterAsync` normalises the email to
   lowercase, rejects duplicates, hashes the password with BCrypt, and creates the `User`
   plus its `UserProfile` in one `SaveChangesAsync`.
2. **The first user in the database becomes `Admin`** (`isFirstUser` check); everyone
   after is `Student`.
3. Onboarding deadlines are seeded immediately after the user is persisted, guarded by
   the `User.HasSeededDeadlines` flag. See [DATABASE.md](DATABASE.md#seeding).
4. `JwtTokenService` issues an HS256 token with `NameIdentifier`, `Email`, `Role`, `Jti`,
   valid for **1 hour**.

The signing key comes from `Jwt:Secret` (user-secrets in Development, `Jwt__Secret` env
var in Production). `Program.cs` throws at startup if it is missing — a misconfigured
machine fails loudly rather than signing with a weak key.

Authorisation is claims-based: protected controllers derive the user id from
`ClaimTypes.NameIdentifier`, **never** from a route or query parameter, and services
scope every query by that id. `DeadlineService`, for instance, filters on
`item.UserId == userId`, so one user touching another's row returns `404`, not `403`
(deliberate — it does not confirm the row exists).

> ⚠️ Six controllers do **not** follow this rule yet — see [Known gaps](#known-gaps).

## Dependency injection

All registrations are in `Program.cs`, all `Scoped`:

```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDeadlineService, DeadlineService>();
// ...one line per interface
```

`JwtTokenService`, `PasswordHasherService`, and `StripePaymentService` are registered as
concrete types (no interface). `GeminiAiService` uses `AddHttpClient<>`.

## The stub convention

Eight services are placeholders that return fixed values and never touch the database.
Each carries an XML doc comment beginning `STUB:` naming the exact fake value:

```csharp
/// <summary>
/// STUB: not implemented. Always returns an empty list; no matching logic exists yet.
/// ...
/// </summary>
public class RecommendationService : IRecommendationService
```

Find them all:

```powershell
Select-String -Path src/FutureWings.Infrastructure/Services/*.cs -Pattern "STUB:"
```

Currently: `ApplicationService`, `DocumentService`, `PaymentService`, `ProfileService`,
`RecommendationService`, `ReviewService`, `ScholarshipService`, `VisaService`.

**Never build on a stub's return value.** They are wired into DI and return `200`, so
they look functional from the outside.

## Adding a feature end to end

1. **Entity** — add to `Domain/Entities/`, no attributes or usings.
2. **DbSet + configuration** — register in `FutureWingsDbContext`, and configure
   `HasMaxLength`/`HasPrecision`/indexes in `OnModelCreating`. Skipping this gives you
   `nvarchar(max)` columns (see [DATABASE.md](DATABASE.md#column-sizing)).
3. **Migration** — `dotnet ef migrations add <Name>` (see [DATABASE.md](DATABASE.md#adding-a-migration)).
4. **DTOs** — `Application/DTOs/<Feature>/`. Put `DataAnnotations` here; they drive the
   automatic `400` from `[ApiController]`.
5. **Interface** — `Application/Interfaces/IXService.cs`.
6. **Implementation** — `Infrastructure/Services/XService.cs`, taking `FutureWingsDbContext`.
7. **Register** — one line in `Program.cs`.
8. **Controller** — `Web/Controllers/`, with `[Authorize]` and the user id from claims.
9. **Frontend** — a page in `ClientApp/src/pages/` plus components in
   `ClientApp/src/components/<feature>/`.

Mirror client validation to the server's limits. A `MaxLength(200)` with no matching
`maxLength` on the input surfaces the raw .NET message
(*"The field Title must be a string or array type with a maximum length of '200'."*)
directly in the UI.

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
- Tailwind only emits arbitrary values it can read **verbatim** in source. A class built
  by interpolation (`` `bg-[${color}]` ``) silently produces no CSS. Store complete class
  strings in data objects instead.

## Known gaps

Real, verified, and unfixed — worth knowing before you build on top of them.

| Gap | Detail |
| --- | --- |
| **Unauthenticated user-scoped endpoints** | `Profile`, `Application`, `Document`, `Recommendation`, `Payment`, `Review` controllers take a user id from the route/query/body with no `[Authorize]`. All return `200` without a token. Harmless only because their services are stubs — add auth *before* implementing any of them |
| **No 401 handling in the SPA** | Tokens last 1 hour. On expiry the UI keeps rendering, every request fails, and the session is never cleared. Fix belongs in `apiRequest` in `auth.js` |
| **No client-side routing** | Navigation is `useState`, so no deep links, no back/forward, and refresh returns to the dashboard |
| **SignalR is inert** | `NotificationHub` is mapped at `/hubs/notifications` but nothing publishes to it and the frontend has no client |
| **Thin test coverage** | Three unit tests (JWT claims, password hashing). No integration tests; `tests/FutureWings.Tests/Controllers/` is an empty placeholder awaiting `Microsoft.AspNetCore.Mvc.Testing` |
