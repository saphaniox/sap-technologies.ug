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

The deployment configuration remains split by application: Vercel builds the client from `sap-technologies-official/`, and Render builds the API from `server/`.
