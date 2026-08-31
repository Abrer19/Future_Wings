# FutureWings

A study-abroad planning platform: students discover university programs, shortlist and
compare them, and track application deadlines. Administrators get an operations console
for users and activity.

**Stack** — .NET 8 Web API (JSON-only; the Razor/MVC scaffolding has been removed) with
Entity Framework Core on SQL Server, and a React 19 + Vite + Tailwind frontend in
`ClientApp/`. All UI lives in the React app.

## Documentation

| Doc | Covers |
| --- | --- |
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Layer rules, request flow, auth, DI, the stub convention, adding a feature end to end |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, migration history, seeding, adding a migration |
| [ClientApp/README.md](ClientApp/README.md) | Frontend setup and layout |

## Prerequisites

- .NET SDK with the .NET 8 targeting pack
- SQL Server Express (a local `.\SQLEXPRESS` instance works with no config change)
- Node.js and npm

## Quick start

```powershell
# 1. Backend dependencies
dotnet restore

# 2. Set the JWT signing key (once per machine — see below)
dotnet user-secrets set "Jwt:Secret" "$([Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 })))" --project src/FutureWings.Web

# 3. Run the API — this creates and seeds the database on first start
dotnet run --project src/FutureWings.Web

# 4. In a second terminal, run the frontend
cd ClientApp
npm install
npm run dev
```

Then open <http://localhost:5173>. The API listens on <http://localhost:5002> (and
`https://localhost:7189` via the `https` launch profile), with Swagger UI at
`/swagger` in Development.

**The backend must be running** for anything past the public homepage — Vite proxies
`/api` to port 5002, and the signed-in pages will show an error banner without it.

### The first account you register becomes an Admin

`AuthService.RegisterAsync` promotes the very first user in the database to the `Admin`
role; everyone after that is a `Student`. Register your own account first to get the
Admin console.

## Configuration

### JWT signing key (required)

The JWT secret is deliberately **not committed**. Startup throws immediately if it is
missing, so a misconfigured machine fails loudly rather than signing tokens with a weak
key.

- **Development** — `dotnet user-secrets`, as in the quick start above.
- **Production** — supply the `Jwt__Secret` environment variable.

### Database

The connection string in `src/FutureWings.Web/appsettings.json` targets `.\SQLEXPRESS`
with Windows authentication, so a local SQL Server Express instance needs no edit. Point
it elsewhere if your instance differs.

On every start the API runs `Database.MigrateAsync()` and then seeds reference data
(application lifecycle states, and the country/university/program catalogue). Both
seeders are idempotent — restarting never duplicates rows. **You do not need to run
`dotnet ef database update` manually**; it is only useful if you want to apply
migrations without starting the app:

```powershell
dotnet tool restore
dotnet ef database update --project src/FutureWings.Infrastructure --startup-project src/FutureWings.Web
```

### Other integrations

`GeminiApi` and `Stripe` keys in `appsettings.json` are placeholders. Both services are
signature-only stubs today and are not called by anything, so the app runs fine without
real keys.

## Tests

```powershell
dotnet test
```

Three unit tests currently cover JWT claim generation and password hashing. There is no
integration-test or frontend-test suite yet. Stop the API before building — a running
instance locks the output DLLs and `dotnet build` will fail with `MSB3021`.

## Solution layout

```
src/
  FutureWings.Domain/          Entities only. No dependencies on anything.
  FutureWings.Application/     DTOs and service interfaces (the contracts).
  FutureWings.Infrastructure/  EF Core DbContext, migrations, seeders, and every
                               concrete service implementation (real and stub).
  FutureWings.Web/             API controllers, SignalR hub, composition root.
tests/
  FutureWings.Tests/           Services/ and Controllers/ (the latter awaiting
                               integration tests).
ClientApp/                     React frontend — see ClientApp/README.md.
```

Dependencies point inward: `Domain <- Application <- Infrastructure <- Web`. Interfaces
live in `Application/Interfaces/`; implementations always live in `Infrastructure/Services/`.

`FutureWings.Web.csproj` sets `<StaticWebAssetsEnabled>false</StaticWebAssetsEnabled>`.
This is required, not cosmetic: the project has no `wwwroot`, and without it the SDK's
static-web-assets manifest makes startup throw `DirectoryNotFoundException`.

## Feature status

Not every endpoint is implemented. These are backed by the database and reachable from
the UI:

| Feature | Notes |
| --- | --- |
| Authentication | Register/login, BCrypt hashing, JWT, role claims |
| Deadlines | Full CRUD, scoped per user; 7 onboarding tasks seeded at registration |
| Discovery | Program search, country/level filters, shortlist, comparison |
| Admin | Dashboard metrics, user list, role changes with a self-demotion guard |

The remaining services are **stubs** that return fixed placeholder values and never touch
the database — Applications, Documents, Payments, Profile, Recommendations, Reviews,
Scholarships, and Visa. Each is marked in source with a `STUB:` doc comment:

```powershell
Select-String -Path src/FutureWings.Infrastructure/Services/*.cs -Pattern "STUB:"
```

Their frontend counterparts render a placeholder card. Do not build on their return values.

## Known issues

- **Unauthenticated user-scoped endpoints.** `Profile`, `Application`, `Document`,
  `Recommendation`, `Payment`, and `Review` controllers take a user id from the route,
  query, or body and have no `[Authorize]` attribute. They are only harmless today
  because the services behind them are stubs; each needs an auth attribute and a
  claims-based owner check before its service is implemented.
- **No 401 handling in the frontend.** JWTs last one hour. When one expires the SPA
  keeps rendering, every request fails, and the session is not cleared — the user has to
  log out manually. `apiRequest` in `ClientApp/src/auth.js` needs to clear the session
  and redirect on a 401.
- **No client-side routing.** Navigation is React state, so there is no deep linking, no
  browser back/forward, and a refresh always returns to the dashboard.
