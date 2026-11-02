# FutureWings Azure & Vercel Production Deployment Guide

This document provides a comprehensive operational guide for the production deployment of the **FutureWings** study-abroad planning platform. It details the cloud architecture, Azure resource provisioning, environment configuration, database migrations, security policies, and teardown procedures.

---

## 1. Cloud Architecture Overview

FutureWings operates on a high-availability, low-cost cloud architecture tailored for Azure Student / Cost-Optimized tiers:

```
[ Web Browser ]
      │
      ▼ (HTTPS)
[ Vercel Frontend SPA ]
  - React 19 + Vite + Tailwind CSS
  - Production URL: https://future-wings-smart-path-to-study-ab.vercel.app
      │
      ▼ (HTTPS API Calls with CORS & JWT Bearer)
[ Azure App Service (Linux B1) ]
  - Backend: ASP.NET Core .NET 8 Web API
  - Endpoint: https://futurewings-api-b099.azurewebsites.net
  - Health Probe: /api/health & /health
      │
      ├── (Encrypted TDS / TLS 1.2) ──► [ Azure SQL Database (Basic 5 DTU) ]
      │                                   - Server: futurewings-sql-b099.database.windows.net
      │                                   - Database: futurewings-db
      │                                   - 11 EF Core Schema Migrations Applied
      │
      └── (HTTPS REST API / SAS)   ──► [ Azure Blob Storage (Standard_LRS) ]
                                          - Storage Account: futurewingsb099sa
                                          - Container: documents
                                          - Durable persistence with user ownership isolation
```

---

## 2. Provisioned Azure Resources

All resources are deployed in a dedicated resource group in `centralindia`:

| Resource | Azure Name | Tier / SKU | Monthly Cost Est. |
| :--- | :--- | :--- | :--- |
| **Resource Group** | `futurewings-prod` | N/A | Free |
| **App Service Plan** | `futurewings-asp` | Linux Basic `B1` | ~$13.00 |
| **App Service Web App** | `futurewings-api-b099` | .NET 8 (Linux Native) | Included in ASP |
| **Azure SQL Server** | `futurewings-sql-b099` | Logical Server | Free |
| **Azure SQL Database** | `futurewings-db` | Basic (5 DTUs, 2 GB) | ~$5.00 |
| **Azure Storage Account** | `futurewingsb099sa` | Standard_LRS (Hot) | ~$0.10 |
| **Blob Container** | `documents` | Private (No anonymous) | Included |
| **Vercel Project** | `future-wings-smart-path-to-study-abroad` | Hobby / Team | Free |

> [!NOTE]
> Total estimated monthly cost is under ~$19/month, comfortably within the Azure Student annual credit allowance ($100).

---

## 3. Azure Backend Application Configuration

The following application settings are managed in Azure App Service (`Configuration -> Application settings`). **No sensitive credentials or connection strings are stored in source control.**

| Configuration Setting Key | Purpose / Value Description | Sensitive |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | Set to `Production` | No |
| `ConnectionStrings__DefaultConnection` | ADO.NET connection string to Azure SQL `futurewings-db` with TLS 1.2 | **Yes** |
| `Storage__ConnectionString` | Connection string to Azure Storage Account `futurewingsb099sa` | **Yes** |
| `Storage__ContainerName` | Blob container name: `documents` | No |
| `Jwt__Secret` | 256-bit cryptographically secure random base64 secret | **Yes** |
| `Jwt__Issuer` | `FutureWings` | No |
| `Jwt__Audience` | `FutureWingsUsers` | No |
| `Cors__AllowedOrigins` | Approved comma-separated frontend origins: `https://future-wings-smart-path-to-study-ab.vercel.app` | No |
| `DemoMode__Enabled` | `true` for evaluator judging demo account; `false` in standard production | No |
| `Stripe__SecretKey` | Production Stripe secret key (disabled/unconfigured by default) | **Yes** |
| `Stripe__PublishableKey` | Production Stripe publishable key | No |
| `Stripe__WebhookSecret` | Stripe webhook signing secret | **Yes** |
| `GeminiApi__Key` | Google Gemini API key (disabled/unconfigured by default) | **Yes** |
| `GeminiApi__Model` | `gemini-2.0-flash` | No |

---

## 4. Database Migrations Procedure

EF Core migrations must be executed safely against the remote Azure SQL database:

1. **Firewall Access**: Ensure the migration runner IP or Azure Services has firewall access to the logical server:
   ```bash
   az sql server firewall-rule create \
     --resource-group futurewings-prod \
     --server futurewings-sql-b099 \
     --name AllowLocalRunner \
     --start-ip-address <YOUR_IP> \
     --end-ip-address <YOUR_IP>
   ```

2. **Execute Migrations**: Run EF Core bundle or CLI tool pointing to the production connection string:
   ```bash
   dotnet ef database update \
     --project src/FutureWings.Infrastructure \
     --startup-project src/FutureWings.Web \
     --connection "<AZURE_SQL_CONNECTION_STRING>"
   ```

3. **Migrations Applied**:
   - `20260312000000_InitialCreate`
   - `20260312100000_AddRefreshTokens`
   - `20260312150000_AddReviewSystem`
   - `20260313093000_AddUniversityRankings`
   - `20260314140000_AddStudentDeadlines`
   - `20260315100000_AddDocumentVault`
   - `20260316000000_AddStripeSubscriptions`
   - `20260317000000_AddAgentPortal`
   - `20260317100000_AddStudentProfileAndRecommendations`
   - `20260318000000_AddDocumentMetadata`
   - `20260319000000_AddVisaRiskProfile`

4. **Firewall Lockdown**: After migrations, remove temporary runner rules to maintain strict zero-trust access.

---

## 5. Document Storage (Azure Blob Storage)

Document storage is abstracted through `IDocumentService` in `FutureWings.Infrastructure`:
- When `Storage:ConnectionString` is configured, files are uploaded directly to the private Azure Blob Storage container `documents` using the `Azure.Storage.Blobs` SDK.
- Files are protected by magic byte inspection (`%PDF`, `\x89PNG`, `JPEG`, `DOC`, `DOCX`), MIME type validation, 10 MB limit enforcement, and strict user ownership authorization.
- If no connection string is provided (local developer workflow), it automatically falls back to safe local filesystem storage.

---

## 6. Vercel Frontend Configuration

The React 19 frontend is hosted on Vercel with single-page application routing rewrites.

1. **Environment Variables**:
   In Vercel Project Settings (`future-wings-smart-path-to-study-abroad`):
   - `VITE_API_URL` = `https://futurewings-api-b099.azurewebsites.net/api`
   - (Applies to `Production`, `Preview`, `Development`)

2. **SPA Routing**:
   The `vercel.json` ensures client-side routing handles deep links like `/login`, `/dashboard`, `/programs`, etc.:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/" }]
   }
   ```

---

## 7. Health & Monitoring Endpoints

Unauthenticated health probes are available for Azure load balancers, uptime monitoring, and CI/CD pipelines:
- `GET https://futurewings-api-b099.azurewebsites.net/health`
- `GET https://futurewings-api-b099.azurewebsites.net/api/health`

**Expected Response**:
```json
{
  "status": "Healthy",
  "timestamp": "2026-11-01T10:49:39.3801513+00:00"
}
```

The App Service is configured with `healthCheckPath: "/api/health"` to automatically replace unhealthy worker instances.

---

## 8. Production Reliability & Security Hardening (Post-Audit Fixes)

The following surgical enhancements have been applied, validated locally via 117 .NET unit tests and 7 Vitest frontend tests, and deployed to Azure:

1. **Application Error Responses & Ownership Isolation**:
   - `GET /api/applications/{id}` returns HTTP 404 when the application is missing or belongs to a different user.
   - `PATCH /api/applications/{id}/status` returns HTTP 404 for unknown/cross-user applications and HTTP 400 for invalid statuses.
   - `POST /api/applications` with non-existent programs returns a controlled HTTP 404 with error message (never 500).
   - Only repository-standard exceptions (`KeyNotFoundException`, `ArgumentException`, `InvalidOperationException`) are handled.

2. **Gated Payment Processing in Production**:
   - `POST /api/Payment/subscription` is strictly gated behind `!isProduction && isDemoMode`. In Production, it returns HTTP 503 Service Unavailable with a safe error message.
   - `POST /api/subscription/simulate-checkout` remains disabled in Production, returning HTTP 503.

3. **Azure SQL Cloud Resilience & Transient Retries**:
   - In `Program.cs`, `options.UseSqlServer` is configured with `EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)` to handle Azure SQL transient disconnects gracefully.

4. **Demo Mode Safety & Staff Account Lockdown**:
   - Staff accounts (`Admin`, `Agent`) are strictly prohibited from being seeded in Production (`!app.Environment.IsProduction()`), even if configuration flags are accidentally passed.
   - Only the designated Student judge account (`demo@futurewings.io`) is preserved when demo mode is explicitly enabled.

5. **Frontend Review XSS Protection**:
   - User reviews and comments are rendered via `ReviewCard.jsx` as standard React text nodes (JSX escaping via `document.createTextNode`), preventing script tag or `<img>` event execution.
   - Vitest unit tests in `ReviewCard.test.jsx` verify that `<script>alert(1)</script>` and `<img onerror=...>` payloads are rendered as literal text without injecting DOM elements.

---

## 9. Demo Mode Enable / Disable Procedure

For hackathons and judge evaluations, a gated demo mode provides a pre-populated student portfolio without compromising production security:

### Enable Demo Mode
```bash
az webapp config appsettings set \
  --name futurewings-api-b099 \
  --resource-group futurewings-prod \
  --settings DemoMode__Enabled=true
```
- **Judge Student Account**:
  - Email: `demo@futurewings.io`
  - Password: `Password123!`
  - Role: `Student` (Cannot be escalated to Admin)
  - Pre-seeded with 5 university applications, active deadlines, uploaded documents, and Pro tier.

### Disable Demo Mode (Post-Judging Production Lock)
```bash
az webapp config appsettings set \
  --name futurewings-api-b099 \
  --resource-group futurewings-prod \
  --settings DemoMode__Enabled=false
```
Once set to `false`, the demo seeder is skipped entirely upon app startup.

---

## 10. Rollback & Teardown Commands

To cleanly remove all deployed Azure infrastructure and prevent any further billing against the subscription:

```bash
# Delete the entire production resource group and all contained resources
az group delete --name futurewings-prod --yes --no-wait

# Confirm deletion progress
az group show --name futurewings-prod --query properties.provisioningState
```

To remove the Vercel production deployment:
```bash
vercel remove future-wings-smart-path-to-study-abroad --yes
```
