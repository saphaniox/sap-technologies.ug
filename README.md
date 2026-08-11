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
2. Keep **Root Directory** at the repository root (`.`). Do not select `sap-technologies-official/`.
3. Deploy. The root `vercel.json` installs and builds the client and serves `sap-technologies-official/dist`.
4. Add the client environment variables from `sap-technologies-official/.env.example` in the Vercel project settings.

### Render server

Create the service from the same GitHub repository. The root `render.yaml` configures Render to build and start the API from `server/`.
