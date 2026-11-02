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

## Real-Time Notification System

FutureWings provides an accessible, real-time notification bell system for timely updates about approaching deadlines, status changes, and critical academic events.

### SignalR Hub & Authentication

- **Hub Endpoint**: `/hubs/notifications` mapped via `app.MapHub<NotificationHub>("/hubs/notifications")`.
- **WebSocket Authentication**: Browsers cannot send arbitrary headers during WebSocket negotiation. ASP.NET Core `JwtBearerEvents.OnMessageReceived` intercepts query tokens (`/hubs/notifications?access_token=...`) and attaches them to `context.Token`.
- **User Scoping**: `NotificationHub` is tagged with `[Authorize]`. Real-time messages are broadcast strictly by user identifier (`ClaimTypes.NameIdentifier`) via `Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notificationDto)`.
- **Decoupled Architecture**: Real-time push is abstracted behind `INotificationBroadcaster` in `Application/Interfaces/`, implemented by `SignalRNotificationBroadcaster` in `Web/Services/`. Broadcasting errors are caught and logged so failures never fail underlying database transactions.

### Backend Endpoints

All notification endpoints are authenticated and strictly scoped to the caller's JWT user ID:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/notifications?unreadOnly=false&limit=50` | Evaluates pending deadline reminders and returns `{ unreadCount, notifications }` |
| `GET` | `/api/notifications/unread-count` | Evaluates reminders and returns `{ unreadCount }` for fast polling checks |
| `PUT` | `/api/notifications/{id}/read` | Marks a specific notification as read and sets `ReadAt` timestamp |
| `PUT` | `/api/notifications/read-all` | Marks all unread notifications for the user as read |
| `DELETE` | `/api/notifications/{id}` | Deletes / dismisses a user-owned notification |

### Supported Notification Types

- `deadline_30d`: Upcoming deadline scheduled in 30 days.
- `deadline_7d`: Approaching deadline due within 7 days.
- `deadline_3d`: Imminent deadline due within 3 days.
- `deadline_1d`: Urgent deadline due tomorrow / within 24 hours.
- `deadline_overdue`: Non-completed deadline past its due date.
- `application_status`: Application state updates and decision notices.
- `scholarship_deadline`: Scholarship deadlines and checklist updates.
- `profile_reminder`: Reminders for incomplete core profile fields or document uploads.
- `subscription`: Pro/Premium plan upgrades, renewals, and invoice notifications.
- `announcement`: Important platform announcements and system updates.

### Reliable Idempotent Timing Rules

- When deadlines are checked (via `GenerateDeadlineRemindersAsync`), active, non-completed deadlines (`CompletedAt == null`) are evaluated against `DateTimeOffset.UtcNow`.
- Completed deadlines (`CompletedAt != null`) or deleted deadlines are strictly excluded.
- Deduplication is guaranteed using the unique composite `(UserId, EventKey)` constraint. Event keys follow deterministic patterns:
  - Overdue: `deadline-{id}-overdue`
  - 1-Day: `deadline-{id}-1d`
  - 3-Day: `deadline-{id}-3d`
  - 7-Day: `deadline-{id}-7d`
  - 30-Day: `deadline-{id}-30d`
- Repeated executions or concurrent API calls never create duplicate notifications.

### Frontend Integration & Fallback Polling

- **Header / Sidebar Bell**: Mounted in the authenticated header/sidebar with live unread badge (`NotificationBell.jsx`).
- **Accessible Popover Panel**: Accessible `role="dialog"` popover (`NotificationPanel.jsx`) with `Escape` to close, click-outside dismissal, unread filter tabs, mark all read, individual mark read, and item deletion.
- **Contextual Navigation**: Clicking a notification with a `TargetPage` (e.g. `Dashboard`, `Scholarships`, `Applications`, `Profile`, `Plans`) automatically marks it as read and navigates directly to the target feature.
- **Resilient Fallback**: If SignalR WebSockets/SSE disconnect or are blocked, the client automatically falls back to periodic interval polling (every 45s) and automatic re-sync on window focus.

---

## 13. Discovery Featured Study Tracks & Dedicated Program Details Experience

### Architecture & Data Model Enhancements
- **Domain Entity**: Extended `Program` entity (`src/FutureWings.Domain/Entities/Program.cs`) with optional metadata fields:
  - `Description`: Overview of the program curriculum and academic focus.
  - `Requirements`: Language prerequisites (IELTS/TOEFL) and academic criteria (B.Sc., GPA).
  - `OfficialLink`: Official university departmental application portal link.
- **EF Migration**: Added migration `AddProgramDetailsFields` with explicit max lengths in `FutureWingsDbContext`.
- **DTOs (`DiscoveryDtos.cs`)**:
  - `DiscoveryProgramDto`: Extended with `Description`, `Requirements`, `OfficialLink`, `IsTracked`, and `ApplicationId`.
  - `DiscoveryResultDto`: Extended with `IReadOnlyList<string> StudyTracks` populated from real catalog tag data.
- **Service Layer (`DiscoveryService.cs`)**:
  - `SearchAsync(int userId, string? query, string? country, string? level, string? track)`: Supports filtering by study track, dynamically parses distinct catalog tags as `studyTracks`, and checks user application tracking status (`IsTracked`).
  - `GetProgramByIdAsync(int userId, int programId)`: Looks up a program by ID including `University`, `Country`, saved status, and tracking status.
- **Controller Layer**:
  - `GET /api/discovery`: Accepts `track` query parameter alongside `country`, `level`, and `query`.
  - `GET /api/discovery/programs/{id:int}`: Returns 200 with `DiscoveryProgramDto` or 404 ProblemDetails.
  - `GET /api/program/{id:int}`: Direct program route returning 200 or 404.

### Frontend User Experience & Accessibility
- **Featured Study Track Filter**:
  - Dropdown filter (`#track-filter`) populated dynamically from catalog data (`result.studyTracks`) with an "All study tracks" default.
  - Interactive quick-select track pills in the "Featured Study Tracks & Destinations" section that sync seamlessly with the dropdown.
  - Active filter chips (`Track: ...`, `Country: ...`, `Level: ...`, `Keyword: ...`) with individual dismiss buttons and a "Reset all" action.
  - Full filter combination support preserving destination, search query, degree level, and saved shortlist status.
- **Program Details Modal (`ProgramDetailsModal.jsx`)**:
  - Accessible dialog (`role="dialog"`, `aria-labelledby="program-details-title"`, `aria-modal="true"`) with backdrop dismissal and `Escape`-key close support.
  - Comprehensive metadata rendering: program name, university, city, country, degree level, duration, annual tuition, match score, tags/study tracks, program overview, language & admission requirements, and official university portal link.
  - Safe empty states displaying "Not specified" for missing optional fields.
  - Shortlist bookmark action (`Save to Shortlist` / `Saved in Shortlist`) calling `PUT`/`DELETE /api/discovery/saved/{id}`.
  - Direct tracking action (`Add to Applications`) calling `POST /api/applications` with idempotent conflict resolution.
  - Resilient direct lookup by ID handling loading skeletons, 404 not-found states, and API error states with retry functionality.
  - "Back to Programs" navigation restoring search results without losing filter context.

### Automated Test Coverage
- **Backend Tests**:
  - `DiscoveryServiceTests.cs`: Verified track filtering, dynamic study track extraction, and `GetProgramByIdAsync` lookup with saved and tracked state.
  - `DiscoveryControllerTests.cs`: Verified `GET /api/discovery?track=...` and `GET /api/discovery/programs/{id}` (200 / 404).
- **Frontend Tests (`Discovery.test.jsx`)**:
  - Dropdown rendering with real catalog tracks and "All study tracks" option.
  - Filter by track alone and combined with country/level filters.
  - Clearing track filter via dropdown, active filter chip, and "Clear filters" button.
  - Featured track chip toggle syncing with track filter.
  - Program card "View Details" action opening dedicated modal with correct data without navigating away.
  - "Not specified" fallback rendering for null/missing fields.
  - Saving/unsaving and adding to application tracking from the details view.
  - Modal dismissal via Back button, close button, and Escape key.
  - Direct lookup by ID handling loading, 404 not found, and error retry states.

---

## 14. Add to Application Tracker Action across Program Cards & Recommendations

### Architecture & Backend User Isolation
- **Backend Service Contract (`IApplicationService` & `ApplicationService.cs`)**:
  - `CreateAsync(int userId, ApplicationCreateDto request)`: Derives user identity strictly from JWT claims (`ClaimTypes.NameIdentifier`), validates program existence, and creates a tracked application record defaulting to the `Draft` status (`SubmittedAt = DateTimeOffset.UtcNow`).
  - **Idempotency & Database Constraint**: Enforced via composite unique index `(UserId, ProgramId)` in `FutureWingsDbContext`. Duplicate requests throw `InvalidOperationException` and return `HTTP 409 Conflict` with `{ message: "You are already tracking an application for this program." }`, completely avoiding unhandled 500 server errors.
  - `GetAllAsync(userId)`: Returns all applications for the authenticated user only, providing full context (`ProgramName`, `UniversityName`, `Country`, `Level`, `Status`, `CreatedAt`).
- **Enriched Recommendation DTO (`RecommendationResultDto.cs` & `RecommendationService.cs`)**:
  - Added `IsTracked: bool` and `ApplicationId: int?` properties.
  - Populated in a single batch query against `context.Applications.Where(app => app.UserId == userId)` to avoid N+1 queries.

### Frontend Integration & Global UI Design
- **Discover Cards (`Discovery.jsx`)**:
  - Every catalog card features an accessible semantic button:
    - Primary orange `Add to Application Tracker` button when untracked.
    - Spinner and `Tracking…` disabled state while the request is in flight.
    - Success badge styling `In Application Tracker` when already tracked.
  - Card footer places `View Details` with secondary neutral styling and the tracker action side by side.
  - The bookmark shortlist heart action remains completely separate at the top-right of the card.
  - Initial load executes a single batch fetch to `/api/applications` alongside `/api/discovery` to resolve already-tracked states without per-card requests.
- **Recommended Degree Program Cards (`Recommendations.jsx`)**:
  - Added the same `Add to Application Tracker` / `In Application Tracker` button on each recommendation card alongside the `Save to Shortlist` action.
  - Fetches existing tracked applications in `loadData` batch request and immediately updates the card state upon tracking.
- **Program Details Modal (`ProgramDetailsModal.jsx`)**:
  - Modal action bar includes `Add to Application Tracker` / `In Application Tracker` (with success styling) and communicates updates to the parent card via `onTrackProgram`.
- **Immediate State & Feedback**:
  - Immediate optimistic card update without page reloads.
  - Toast notification (`Toast.jsx`) shows `Added to Application Tracker` with a direct `View Application Tracker` action button that navigates directly to the `Applications` page.
  - Duplicate/conflict responses gracefully update the card to `In Application Tracker` and display a clear informational toast.

### Automated Test Coverage
- **Backend Tests (`RecommendationServiceTests.cs`, `ApplicationServiceTests.cs`, `ApplicationControllerTests.cs`)**:
  - Default status is `Draft` with valid `ApplicationId` and timestamps.
  - Verified user ownership isolation across requests.
  - Verified unique constraint and idempotent conflict response on duplicate tracking attempts.
  - Verified `GetRecommendationsAsync` populates `IsTracked` and `ApplicationId`.
- **Frontend Vitest Suites**:
  - `Discovery.test.jsx`: Tests tracker button rendering, tracking flow, success toast with `View Application Tracker` action, existing tracked card rendering, and duplicate handling.
  - `Recommendations.test.jsx`: Tests tracker button rendering, tracking flow, success toast, navigating to tracker on click, duplicate prevention, and separate save/unsave behavior.
  - `Toast.test.jsx`: Tests message display and action button activation.

---

## 15. Back to Homepage Navigation on Sign In & Sign Up Pages

### Architecture & DRY Shared Implementation
- **Shared Authentication Layout (`ClientApp/src/components/auth/AuthLayout.jsx`)**:
  - Encapsulates the visual card layout for both `Login.jsx` and `Register.jsx`.
  - Added an optional `onBackToHome` navigation callback prop.
  - Positioned the accessible `Back to Homepage` button cleanly above the authentication card (`w-full max-w-md space-y-4`), avoiding form clutter and maintaining consistent layout across mobile and desktop.
  - Renders a clean left arrow via accessible inline SVG (`aria-hidden="true"`) to prevent raw HTML entities (`&larr;` / `&rarr;`).
  - Styled with secondary neutral design tokens (`text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800`), ensuring it remains visually secondary to primary form submission buttons (`Sign in` / `Create account`).
  - Includes prominent accessible focus rings (`focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none`) and meets WCAG color contrast guidelines.
- **Pages Integration (`Login.jsx` & `Register.jsx`)**:
  - Accept `onBackToHome` and default gracefully to `() => onNavigate?.('Home')`.
  - Preserved all existing form validation, error banners, submission states, and the bottom "switch account mode" navigation links (`Sign in` <-> `Create account`).
- **Application Navigation & Routing (`App.jsx`)**:
  - Unauthenticated view router passes `onBackToHome={() => goTo('Home')}` to both `<Login>` and `<Register>`.
  - Updated `onNavigate` handler to support direct navigation to `'Home'`, `'Login'`, and `'Register'`.
  - Clicking "Back to Homepage" invokes `goTo('Home')`, synchronizing URL hash to `#/home` and rendering the public landing page (`<Home>`), rather than triggering browser back history or dashboard navigation.

### Automated Test Coverage
- **Frontend Test Suite (`ClientApp/src/pages/AuthNavigation.test.jsx`)**:
  - 17 unit and integration tests verifying:
    - Visible and accessible "Back to Homepage" button on `Login` and `Register`.
    - Clicking the button calls `onNavigate` with `'Home'` and invokes dedicated `onBackToHome` handlers.
    - Inline SVG arrow presence with `aria-hidden="true"` and absence of raw HTML entities.
    - Preserved Sign In <-> Sign Up toggle links.
    - Preserved form submission flows and client-side password mismatch validation.
    - `AuthLayout` prop fallback handling.
    - Full `App.jsx` integration: navigating from Login to Home, Register to Home, and switching between auth modes.

---

## 16. Public Homepage Navbar Authentication-Aware Navigation (Scholarships & Community)

### Architecture & Destination Preservation
- **Authentication-Aware Controls (`ClientApp/src/components/home/SiteHeader.jsx`)**:
  - Converted the non-functional anchor tags for `Scholarships` and `Community` into accessible semantic `<button type="button">` controls.
  - Retained anchor link functionality for public marketing anchors: `Product` (`#product`), `How It Works` (`#how-it-works`), `Destinations` (`#destinations`), and `FAQ` (`#faq`).
  - Preserved existing brand logo link and authentication CTA buttons (`Sign In` and `Get Started`).
  - Styled with identical design tokens to surrounding navigation items (`rounded-full px-4 py-1.5 text-xs font-semibold text-secondary-600 transition hover:bg-secondary-100 hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`) and matching mobile drawer items (`w-full text-left block rounded-xl px-4 py-2.5 text-sm font-bold text-secondary-800 transition hover:bg-secondary-50 hover:text-primary-600`).
  - Seamlessly handles keyboard navigation (`Enter`/`Space`) and closes the mobile drawer automatically upon selection.
- **Client-Side Return Navigation (`ClientApp/src/lib/navigationStorage.js`)**:
  - Provides `getReturnTo()`, `setReturnTo(destination)`, and `clearReturnTo()` backed by `window.sessionStorage` with safe fallback for restricted or sandboxed environments.
  - When an unauthenticated user clicks `Scholarships` or `Community`:
    1. The destination (`'Scholarships'` or `'Community'`) is persisted to `sessionStorage` and component state.
    2. The application navigates to `'Login'` (`#/login`).
  - Upon successful authentication (`handleAuthenticated` in `App.jsx`):
    1. The intended destination is retrieved and immediately cleared.
    2. The user is redirected directly to the requested page (`#/scholarships` or `#/community`) rather than defaulting to Dashboard.
  - If the user clicks "Back to Homepage" on the login screen, pending return destinations are safely wiped.
- **Authenticated Navigation**:
  - When authenticated, clicking `Scholarships` or `Community` calls `onNavigate('Scholarships')` or `onNavigate('Community')`, immediately switching to the corresponding workspace view without page reload.
  - No protected scholarship or community data is exposed before authentication.

### Automated Test Coverage
- **Unit & Integration Suite (`ClientApp/src/components/home/SiteHeader.test.jsx`)**:
  - 16 tests covering:
    - Unauthenticated Scholarship click navigates to Login and preserves destination.
    - Unauthenticated Community click navigates to Login and preserves destination.
    - Authenticated Scholarship click navigates to Scholarships.
    - Authenticated Community click navigates to Community.
    - Existing public navbar links (Product, How It Works, Destinations, FAQ, brand logo) remain unchanged.
    - Sign In and Get Started buttons function normally.
    - Fallback behavior when `onNavigate` is omitted.
    - Mobile drawer open, focus trap, and item click dismissal.
    - Home page integration with `onNavigate` prop forwarding.
    - Full App integration: unauthenticated user clicks Scholarships/Community, logs in, and is automatically routed to the target page.
    - Full App integration: authenticated student clicks Scholarships/Community from Home page and navigates directly to the workspace view.
