# Eclipse OS

**An edge-native command center:** responsive React interface, Cloudflare Worker health telemetry, a three-stage diagnostic runner, local node registry, and measured execution history.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-222?logo=github) ![Cost](https://img.shields.io/badge/mandatory_cost-%240-ccf576)

## What works

| Module | Function |
| --- | --- |
| Overview | Queries the real deployed Worker at /api/health; displays verified health, colo, round-trip time and recent runs |
| Node grid | Create, label, and remove workspace nodes; status labels are explicitly manual |
| Sequence | Makes three real same-origin requests (health, diagnostics, favicon), measures response times, and records pass/fail |
| Analytics | Shows measured diagnostic durations, success rate, history, JSON export and local history reset |

**Truth in telemetry:** The project does not fabricate CPU, memory, uptime, or network graphs. Cloudflare does not expose that information for arbitrary infrastructure from a client-side app. Runtime data is real; managed node statuses are user-entered. Nodes and recent scan history persist in **this browser only** (localStorage), not to a cloud database. It is an operational starter/dashboard, not infrastructure monitoring of external hosts.

## Deployment — free Cloudflare Workers

Requires a free Cloudflare account and a GitHub repository. Static assets are served on Workers Static Assets (free/unlimited asset requests as documented), while API calls use the Cloudflare Workers Free allocation. No AI APIs, databases, or subscriptions are required.

1. In Cloudflare dashboard, find your **Account ID** and create an API token using the **Edit Cloudflare Workers** template for your account.
2. In GitHub repo **Settings → Secrets and variables → Actions**, add **repository secrets**:
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ACCOUNT_ID
3. Push to the default branch, **source**, or run **Cloudflare / CI & Deploy** via Actions → Run workflow.
4. GitHub Actions will install dependencies, typecheck, build and deploy the Worker and static assets to the generated workers.dev endpoint.

The stable URL is shown in the deployment job log after successful deployment (usually https://eclipse-os.<your-subdomain>.workers.dev). A paid domain is **not** necessary. Workers.dev must be enabled for the account.

The workflow validates pull requests without deploying them. If credentials are missing, validation still runs but deployment is skipped, with a clear note in the job output. Add the secrets before considering the site live.

## Local development

Prerequisite: Node 22+.

    npm ci
    npm run dev

This starts the Vite UI, but the Worker API is unavailable under Vite-only development and the UI correctly reports **EDGE OFFLINE**.

To run the **full stack** locally with the actual Cloudflare Worker runtime:

    npm ci
    npm run build
    npx --yes wrangler@4.136.3 dev

Wrangler serves the bundled app and local Worker API from http://localhost:8787 without requiring a paid account.

For a manual production deployment (after wrangler login):

    npm run build
    npx --yes wrangler@4.136.3 deploy

## CI/CD

The workflow at .github/workflows/cloudflare.yml runs for pull requests, pushes to source and manual dispatch. Validation uses npm ci, npm run typecheck and npm run build; production deploy uses cloudflare/wrangler-action@v4. The previous GitHub Pages upload workflow has been retired, since it uploaded raw TSX without compiling the app.

## Architecture

    React + TypeScript + Vite
                |
    Workers Static Assets (dist/)
                |
    Cloudflare Worker (src/worker.ts)
         /api/health
         /api/diagnostics
                |
    localStorage (private node registry and last 60 scans)

No private tokens are exposed in the browser. There is no public write API, no privileged endpoint, and no database to provision.

## Free-tier note

Free does not mean unlimited. The Worker API is subject to Cloudflare's Workers Free request and CPU limits; static assets are free under Workers Static Assets billing. Running within those limits incurs no mandatory paid-service charge. GitHub-hosted Actions are subject to GitHub's own plan limits.
