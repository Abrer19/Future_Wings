# FutureWings

FutureWings is a .NET 8 MVC/API solution with a Vite React frontend and SQL Server persistence.

## Prerequisites

- .NET SDK with the .NET 8 targeting pack
- SQL Server Express
- Node.js and npm

Update `src/FutureWings.Web/appsettings.json` with valid Gemini, Stripe, and SQL Server settings before using external integrations.

### JWT signing key (required)

The JWT secret is deliberately **not** committed. Startup throws if it is missing.
Set it once per machine:

```powershell
dotnet user-secrets set "Jwt:Secret" "$([Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 })))" --project src/FutureWings.Web
```

In production supply it as the `Jwt__Secret` environment variable instead.

The default connection string targets `.\SQLEXPRESS`, so a local SQL Server Express
instance works with no edit.

## Backend setup

Restore dependencies:

```powershell
dotnet restore
```

Apply the database migration:

```powershell
dotnet tool restore
dotnet ef database update --project src/FutureWings.Infrastructure --startup-project src/FutureWings.Web
```

Run the Web project:

```powershell
dotnet run --project src/FutureWings.Web
```

## Frontend setup

```powershell
cd ClientApp
npm install
npm run dev
```

The frontend development server runs at `http://localhost:5173` by default and is allowed by the backend CORS policy.
