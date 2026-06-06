# CI / Green Build Evidence

Pipeline definition: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — runs on every push / PR to `main` and `develop`.

The workflow runs the same steps that are reproduced locally below. After pushing
the `v0.1.0` tag/branch to GitHub, attach the GitHub Actions run URL or a screenshot
of the green run here:

- GitHub Actions run: `https://github.com/<owner>/<repo>/actions` → latest run on `main`.

## Local pipeline run (reproducible)

- Date: 2026-06-07
- Node.js: v22.12.0
- Command sequence mirrors the CI job `build-test`.

| # | Step | Command | Result |
| --- | --- | --- | --- |
| 1 | Generate Prisma Client | `npm --workspace apps/api run db:generate` | ✅ OK |
| 2 | Static analysis (ESLint) | `npm run lint` | ✅ 0 errors, 0 warnings (58 files) |
| 3 | Type check | `npm run typecheck` | ✅ OK (api + web, `tsc --noEmit`) |
| 4 | Unit tests | `npm test` | ✅ 2 files, 8 tests passed |
| 5 | Production build | `npm run build` | ✅ api `tsc` + web `vite build` OK |

All steps exit 0 → green build.

## How to reproduce

```bash
npm ci
npm --workspace apps/api run db:generate
npm run lint
npm run typecheck
npm test
npm run build
```
