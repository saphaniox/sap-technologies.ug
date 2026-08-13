# SAP Technologies Uganda

This repository contains the complete application:

- `sap-technologies-official/` — React and Vite client
- `server/` — Express API server

## Local setup

Node.js 20 or newer is recommended because the server requires it.

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

Use this repository for both deployments.

### Vercel frontend

1. Import the `saphaniox/sap-technologies.ug` GitHub repository.
2. Set **Root Directory** to `sap-technologies-official`.
3. Use **Install Command** `npm run install:client`.
4. Use **Build Command** `npm run vercel-build`.
5. Use **Output Directory** `sap-technologies-official/dist`.
6. Add the client environment variables from `sap-technologies-official/.env.example` in the Vercel project settings.

### Render server

Create the service from the same GitHub repository. The root `render.yaml` configures Render to build and start the API from `server/`.

### Transactional email

The server sends transactional emails through Mailjet first and automatically falls back to Gmail SMTP if Mailjet fails.

Configure these secret environment variables in Render:

- `EMAIL_PROVIDER_MODE=auto` as the default. Admins can later switch between `auto`, `mailjet`, and `gmail` in the admin dashboard.
- `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` for the primary provider.
- `MAILJET_FROM_EMAIL` with a sender address verified in Mailjet.
- `GMAIL_USER` and `GMAIL_PASS` (a Google App Password) for SMTP fallback.

Keep API keys, secret keys, Gmail app passwords, database, JWT and session secrets in Render env. Use the admin dashboard for safe email settings such as provider mode, from/reply/notification emails, logo URL, tagline, phone and address.

All messages use the shared SAPTech Uganda template, including the hosted logo, responsive branding, human-readable content, plain-text alternatives, reply-to information, and security guidance.
