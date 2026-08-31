# Database & Migrations

Schema, migration history, and how to change either. Setup lives in the
[root README](../README.md); code structure in [IMPLEMENTATION.md](IMPLEMENTATION.md).

- **Provider** — SQL Server (developed against SQL Server 2025 Express)
- **Default connection** — `Server=.\SQLEXPRESS;Database=FutureWings;Trusted_Connection=True`
- **Context** — `FutureWings.Infrastructure/Data/FutureWingsDbContext.cs`
- **Migrations** — `FutureWings.Infrastructure/Data/Migrations/` (non-default location,
  kept beside the context)

## Startup behaviour

`Program.cs` runs this on **every** boot:

```csharp
await context.Database.MigrateAsync();
await ApplicationStateSeeder.SeedAsync(context);
await DiscoverySeeder.SeedAsync(context);
```

So starting the API creates the database and applies pending migrations — you do not
need `dotnet ef database update` for normal work. Both seeders are idempotent and diff
against existing rows, so restarts never duplicate data.

> This is convenient in development and questionable in production, where migrations
> usually belong in a deploy step rather than app startup. Worth revisiting before any
> real deployment.

## Migration history

Six migrations, in order:

| # | Migration | What it does |
| --- | --- | --- |
| 1 | `20260824171314_InitialCreate` | 13 tables: Users, UserProfiles, Countries, Universities, Programs, Scholarships, Applications, ApplicationStates, Documents, VisaOutcomes, Ratings, Notifications, Payments — plus 12 indexes |
| 2 | `20260829085400_AddAuthentication` | `Users.PasswordHash`; `Email` → `nvarchar(320)`; unique `IX_Users_Email` |
| 3 | `20260829091005_AddDeadlines` | `Deadlines` table + composite `IX_Deadlines_UserId_DueAt` |
| 4 | `20260829094311_AddUserRoles` | `Users.Role` (default `Student`) + raw SQL promoting `MIN(Id)` to `Admin` |
| 5 | `20260831153703_AddDiscoveryCatalog` | `Universities.City`; `Programs.{Level, AnnualTuitionUsd, DurationMonths, MatchScore, Tags}`; `Countries.{Description, IsFeatured}`; unique `IX_Countries_Code`; `SavedPrograms` join table |
| 6 | `20260831183345_AddHasSeededDeadlinesFlag` | `Users.HasSeededDeadlines` + backfill (see below) |

### Migration 6 is worth reading

It fixes a real bug and shows the pattern for a data-affecting migration.

`DeadlineService.GetAllAsync` used to seed 7 default deadlines whenever a user had
**zero** rows. That meant deleting every deadline resurrected them on the next fetch —
deletion was never durable and an empty list was unreachable.

The fix moved seeding into `AuthService.RegisterAsync`, guarded by a persisted flag
rather than a row count:

```csharp
migrationBuilder.AddColumn<bool>(
    name: "HasSeededDeadlines", table: "Users",
    type: "bit", nullable: false, defaultValue: false);

// Every account that exists at this point has already been through the old
// seed-on-empty-read path, so mark them all as seeded. Deliberately unconditional:
// a user who genuinely deleted all of theirs must stay empty.
migrationBuilder.Sql("UPDATE [Users] SET [HasSeededDeadlines] = 1;");
```

Two details that matter if you write something similar:

- The column is added with `defaultValue: false` and existing rows are backfilled by
  explicit SQL. The backfill is **unconditional** — gating it on "users who currently
  have deadlines" would have handed the defaults back to anyone who deliberately
  cleared theirs.
- The model deliberately does **not** configure `HasDefaultValue(true)`. EF omits a
  property from the `INSERT` when the model declares a store default and the value
  equals the CLR default, so new users would have been written as `true` and never
  seeded at all.

## Schema

15 tables plus `__EFMigrationsHistory`. Every foreign key is `ON DELETE CASCADE`, so
deleting a `User` removes their profile, deadlines, documents, ratings, notifications,
payments, saved programs, and applications.

### Identity & access

| Table | Columns | Notes |
| --- | --- | --- |
| `Users` | `Id`, `Email nvarchar(320)`, `PasswordHash nvarchar(100)`, `Role nvarchar(20)`, `HasSeededDeadlines bit` | Unique `IX_Users_Email`. `Role` defaults to `Student` |
| `UserProfiles` | `Id`, `UserId`, `FirstName`, `LastName` | 1:1 with `Users` (unique `IX_UserProfiles_UserId`) |

### Catalogue (Discovery)

| Table | Columns | Notes |
| --- | --- | --- |
| `Countries` | `Id`, `Name(100)`, `Code(2)`, `Description(250)`, `IsFeatured bit` | Unique `IX_Countries_Code` |
| `Universities` | `Id`, `CountryId`, `Name(200)`, `City(100)` | |
| `Programs` | `Id`, `UniversityId`, `Name(200)`, `Level(50)`, `AnnualTuitionUsd decimal(12,2)`, `DurationMonths`, `MatchScore`, `Tags(500)` | `Tags` is a comma-separated string, split in `DiscoveryService` |
| `SavedPrograms` | `UserId`, `ProgramId`, `SavedAt` | **Composite PK** `(UserId, ProgramId)`; cascade both ways |

### Deadlines

| Table | Columns | Notes |
| --- | --- | --- |
| `Deadlines` | `Id`, `UserId`, `Title(200)`, `Category(50)`, `Notes(1000) NULL`, `DueAt`, `CreatedAt`, `CompletedAt NULL` | `IX_Deadlines_UserId_DueAt`. `CompletedAt IS NULL` means active — there is no boolean column; `DeadlineDto.IsCompleted` is computed |

### Applications domain — schema exists, code does not

| Table | Columns | Notes |
| --- | --- | --- |
| `Applications` | `Id`, `UserId`, `ProgramId`, `ApplicationStateId`, `SubmittedAt` | Nothing writes to it — `ApplicationService` is a stub |
| `ApplicationStates` | `Id`, `Name` | Seeded: Draft, Submitted, Under Review, Accepted, Rejected, Withdrawn |
| `VisaOutcomes` | `Id`, `ApplicationId`, `Status`, `DecisionDate NULL` | 1:1 with `Applications`. Unwritten |

`ApplicationStateId` is a non-nullable FK, so before `ApplicationStates` was seeded no
application row could be inserted **at all** — the feature was blocked at the database
level, not just the service layer. That is now fixed; inserts succeed.

### Tables with no code behind them

`Documents`, `Notifications`, `Payments`, `Ratings`, and `Scholarships` all exist with
foreign keys and indexes, and **nothing reads or writes them**. Their services are stubs.
`Scholarships` is not seeded either, so `GET /api/scholarship` returns `[]` by
construction.

Note `ScholarshipDto` exposes `EligibilityCriteria` and `AwardAmount`, which **do not
exist** on the `Scholarship` entity or table. Implementing that feature needs a migration
first.

## Column sizing

Tables belonging to implemented features have deliberate lengths; tables belonging to
stub features are all `nvarchar(max)` because their entities were never configured in
`OnModelCreating`:

| Configured | Unconfigured (`nvarchar(max)`) |
| --- | --- |
| `Users`, `UserProfiles`*, `Countries`, `Universities`, `Programs`, `Deadlines` | `ApplicationStates.Name`, `Documents.FileName/FilePath`, `Notifications.Message`, `Payments.Currency/Status`, `Ratings.Comment`, `Scholarships.Name`, `VisaOutcomes.Status` |

\* `UserProfiles.FirstName/LastName` are also `nvarchar(max)` despite the feature being
live — worth tightening.

Add `HasMaxLength` when you implement one of these; changing it later means another
migration. Decimals are explicit: `Payments.Amount` is `(18,2)`, `Programs.AnnualTuitionUsd`
is `(12,2)`.

## Seeding

| Seeder | Seeds | Idempotency |
| --- | --- | --- |
| `ApplicationStateSeeder` | 6 lifecycle states | Diffs against existing names, inserts only what is missing |
| `DiscoverySeeder` | 6 countries / universities / programs (Canada, Germany, Australia, Netherlands, UK, Finland) | Upserts by natural key (country code, university name, program name) |
| `DefaultDeadlineFactory` | 7 onboarding deadlines per new user | **Not** a startup seeder — called once from `AuthService.RegisterAsync`, guarded by `User.HasSeededDeadlines` |

The distinction matters: the first two are reference data refreshed at boot; the third is
per-user data created exactly once at registration. Do not move it back into a read path.

## Adding a migration

```powershell
# Stop the API first — a running instance locks the DLLs and the build will fail
dotnet ef migrations add DescriptiveName `
  --project src/FutureWings.Infrastructure `
  --startup-project src/FutureWings.Web
```

Then:

1. **Read the generated file.** EF's defaults are not always what you want — migration 6
   needed a hand-written backfill.
2. If it changes existing rows, decide explicitly what happens to current data, and say
   why in a comment.
3. Apply it by starting the API (`MigrateAsync` runs automatically), or explicitly:
   ```powershell
   dotnet ef database update --project src/FutureWings.Infrastructure --startup-project src/FutureWings.Web
   ```
4. Verify against the database, not just the build.

To undo a migration that has **not** been applied anywhere else:

```powershell
dotnet ef migrations remove --project src/FutureWings.Infrastructure --startup-project src/FutureWings.Web
```

If it has already been applied, roll forward with a new migration instead — never edit
an applied one.

## Inspecting the database

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -d FutureWings -Q "SELECT name FROM sys.tables ORDER BY name"
sqlcmd -S ".\SQLEXPRESS" -E -C -d FutureWings -Q "SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId"
```

To start clean, drop the database and run the API — it will recreate and reseed:

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "DROP DATABASE FutureWings"
```
