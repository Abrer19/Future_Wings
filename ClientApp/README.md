# FutureWings — ClientApp

The React frontend for FutureWings, a study-abroad planning platform: a public
marketing homepage plus a signed-in student workspace (deadline tracking, program
discovery, and an admin console).

Built with React 19, Vite, and Tailwind CSS. Plain JSX — there is no TypeScript,
router, or state-management library.

## Running it

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:5173 and proxies `/api` to the backend at
http://localhost:5002, so **the backend must be running for anything past the
homepage to load**. See the [repository README](../README.md) for backend setup —
database, migrations, and the required JWT secret.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

There is no test runner configured yet.

## Layout

```
src/
  App.jsx              Shell, auth gate, and page switching
  auth.js              Session storage + the shared fetch wrapper
  pages/               One file per destination in the nav
  components/
    auth/              Shared login/register form primitives
    dashboard/         Deadline dashboard pieces
    home/              Public homepage sections
```

Brand colours and the shared palette live in `tailwind.config.js` as theme tokens
(`primary`, `secondary`, `accent`, `success`, `warning`, `danger`, `surface`) —
prefer those over arbitrary hex values.
