# SAP Technologies Uganda

This repository contains the complete application:

- `sap-technologies-official/` — React and Vite client
- `server/` — Express API server

## Local setup

Node.js 22 or newer is recommended because the server runs on Node 22 in production.

```bash
npm run install:all
npm run dev
```

`npm run dev` starts the client and server together. You can also run them separately:

```bash
npm run dev:client
npm run dev:server
```

Build both applications from the repository root with:

```bash
npm run build
```

Keep local secrets in `server/.env` and the client's local environment files. These files are ignored by Git; commit only the provided `.env.example` templates.

## Deployment

Use this repository for the frontend and both backend deployments.

### Vercel frontend

1. Import the `saphaniox/sap-technologies.ug` GitHub repository.
2. Set **Root Directory** to `sap-technologies-official`.
3. Use **Install Command** `npm run install:client`.
4. Use **Build Command** `npm run vercel-build`.
5. Use **Output Directory** `sap-technologies-official/dist`.
6. Add the client environment variables from `sap-technologies-official/.env.example` in the Vercel project settings.

For the backend URLs, set:

```env
VITE_API_URL=https://your-coolify-api-domain.com
VITE_API_FALLBACK_URL=
VITE_API_FALLBACK_MUTATIONS=false
```

`VITE_API_URL` is the primary Coolify API. `VITE_API_FALLBACK_URL` is optional; only set it to the Render URL when the Render service is active and healthy. Browser-level connection failures can fall back to Render for all requests when a fallback is configured. Keep `VITE_API_FALLBACK_MUTATIONS=false` unless you also want retryable HTTP errors such as 502/503 during write actions to fall back to Render.

Do not put backend secrets such as database URLs, JWT secrets, Mailjet keys, Gmail app passwords or Cloudinary secrets in Vercel client environment variables.

### Coolify server primary

Create a new Coolify application from the same GitHub repository:

1. Repository: `saphaniox/sap-technologies.ug`
2. Branch: `main`
3. Build pack: **Nixpacks**
4. Base directory / root directory: `server`
5. Static site: **No**
6. Port: `5000`
7. Health check path: `/api/health`

The server folder includes `nixpacks.toml`, so Coolify can install, build, and start the backend directly from `server/` without using a custom Dockerfile.

In Coolify, add the backend environment variables from `server/.env.example`. At minimum production needs:

- `NODE_ENV=production`
- `PORT=5000`
- `NIXPACKS_NODE_VERSION=22`
- `CLIENT_URL=https://saptechug.com`
- `FRONTEND_URL=https://saptechug.com`
- `PRODUCTION_CLIENT_URL=https://saptechug.com`
- `API_PUBLIC_URL=https://your-coolify-api-domain.com`
- `ALLOWED_ORIGINS=https://saptechug.com,https://www.saptechug.com,https://sap-technologies.com,https://www.sap-technologies.com`
- `MONGODB_URI`
- `SESSION_SECRET`
- `JWT_SECRET`
- Cloudinary secrets if uploads are enabled
- Mailjet and Gmail secrets if email sending is enabled

After Coolify deploys, copy the public Coolify API URL into Vercel as `VITE_API_URL`.

The Coolify API URL used in Vercel must be `https://...`, not `http://...`. Browsers block an HTTPS frontend from sending login, newsletter, contact, or admin requests to an insecure HTTP API.

### Render server fallback

Keep Render connected to the same GitHub repository. The root `render.yaml` configures Render to build and start the API from `server/`.

When Render is active, you can use it as the fallback server:

```env
VITE_API_FALLBACK_URL=https://sap-technologies-ug.onrender.com
```

If Render is suspended or paused, leave `VITE_API_FALLBACK_URL` empty in Vercel. A suspended Render service returns `503 Service Suspended` without usable CORS headers, which causes browser requests to end as `Failed to fetch`.

For best fallback behavior, Coolify and Render should use the same `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`, email provider credentials, and Cloudinary credentials. That way a valid frontend session can still work when the app has to read from Render.

### Transactional email

The server sends transactional emails through Mailjet first and automatically falls back to Gmail SMTP if Mailjet fails.

Configure these secret environment variables in Coolify and Render:

- `EMAIL_PROVIDER_MODE=auto` as the default. Admins can later switch between `auto`, `mailjet`, and `gmail` in the admin dashboard.
- `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` for the primary provider.
- `MAILJET_FROM_EMAIL` with a sender address verified in Mailjet.
- `GMAIL_USER` and `GMAIL_PASS` (a Google App Password) for SMTP fallback.

Keep API keys, secret keys, Gmail app passwords, database, JWT and session secrets in Coolify and Render env. Use the admin dashboard for safe email settings such as provider mode, from/reply/notification emails, logo URL, tagline, phone and address.

All messages use the shared SAPTech Uganda template, including the hosted logo, responsive branding, human-readable content, plain-text alternatives, reply-to information, and security guidance.
