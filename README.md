# FutureWings

FutureWings is a .NET 8 MVC/API solution with a Vite React frontend and SQL Server persistence.

## Prerequisites

- .NET SDK with the .NET 8 targeting pack
- SQL Server Express
- Node.js and npm

Update `src/FutureWings.Web/appsettings.json` with valid JWT, Gemini, Stripe, and SQL Server settings before using external integrations.

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
