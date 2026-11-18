# Application architecture

The application uses an Express MVC backend and a separate React frontend. React supplies the views; the API returns JSON rather than rendering server templates. Mongoose models also provide the data-access layer, so an additional repository abstraction is not required for each model.

## Repository map

| Location | Responsibility |
| --- | --- |
| `sap-technologies-official/src/pages/` | Route-level React views |
| `sap-technologies-official/src/components/` | UI components, forms, and admin screens |
| `sap-technologies-official/src/hooks/` | Reusable React behavior |
| `sap-technologies-official/src/contexts/` | Shared UI state such as the theme |
| `sap-technologies-official/src/services/` | Browser API client and background services |
| `sap-technologies-official/src/config/` | Public client configuration |
| `sap-technologies-official/src/styles/` | Component and theme styling |
| `server/src/server.js` | HTTP listener and process shutdown |
| `server/src/app.js` | Express composition, database/session initialization, security, and route mounting |
| `server/src/routes/` | URL mapping and ordered middleware |
| `server/src/controllers/` | Request handling and response contracts |
| `server/src/models/` | Mongoose schemas, validation, and persistence |
| `server/src/services/` | Shared business operations and external integrations |
| `server/src/middleware/` | Authentication, authorization, validation, uploads, and errors |
| `server/src/config/` | Server environment, database, session, and security configuration |
| `server/tests/` | Architecture and integration regression checks |
| `scripts/` | Root development orchestration |
| `docs/deployment/` | Operational setup guides |
| `docs/screenshots/` | Reference UI screenshots |
| `keep-alive-deployment/` | Optional standalone keep-alive deployment |

## Request flow

React view → browser API service → `/api` hosting rewrite → Express middleware → route → controller → model/shared service → JSON response → React view.

Production `/api/*` and `/uploads/*` requests use the website origin. Both Vercel configuration files contain the upstream rewrites. Update both when changing the backend origin. Local Vite proxies these paths to port 5000. No server secret belongs in a `VITE_*` variable.

## Boundaries

- Routes wire controllers and middleware. They do not import models or services directly.
- Controllers own HTTP status codes and response shapes. Reusable integrations and operations belong in services; persistence rules belong in models.
- Middleware owns access control and validation. Initial administrator setup lives in `initialAdminSetup.js` and remains guarded by its setup token and existing-admin check.
- `server.js` binds the port. Importing `app.js` does not start a listener, although application initialization still creates database and session connections.
- UI components use the shared API service; database and mail-provider credentials stay on the server.
- Keep generated bundles, logs, local secrets, and temporary QA artifacts out of version control.

The React frontend is component-based, not a second server-style MVC implementation. The admin dashboard shell coordinates state; `components/admin/tabs/` owns section views, `panels/` owns overview and operations panels, `actions/` owns fetching and mutations, and `utils/` owns formatting. Navigation and dialogs have dedicated components.

The browser API keeps its singleton interface in `services/api.js`; domain methods live in `services/api/`. The backend email singleton stays in `services/emailService.js`, while `services/email/` separates configuration, providers, rendering, delivery, and message categories. Method composition preserves the existing public methods and `this` context. Some other feature files remain large and can be split along the same boundaries as they change.

## Verification

Run from the repository root:

```sh
npm test
npm run build
```

`npm test` runs server validation/upload regressions, architecture boundaries, public-route contract checks, and client API-routing regressions. The server build syntax-checks all source modules. `npm run lint:client` runs the full frontend lint check; existing unrelated lint issues are tracked separately from these architecture checks.

Deploy the server with `npm start` from `server/`; the entry point is `src/server.js`. Render and Nixpacks already use that command.
