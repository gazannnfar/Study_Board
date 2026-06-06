# EduKanban checklist mapping

This file maps the teacher checklist to concrete project artifacts.

| # | Checklist item | Project artifact |
| --- | --- | --- |
| 1 | Project charter | `docs/PROJECT-CHARTER.md` |
| 2 | Technical specification | `docs/TECHNICAL-SPECIFICATION.md` |
| 3 | Project management plan | `docs/PROJECT-MANAGEMENT-PLAN.md` |
| 4 | RACI matrix | `docs/RACI.md` |
| 5 | Risk register | `docs/RISK-REGISTER.md` |
| 6 | Use Cases / User Stories | `docs/USER-STORIES.md` |
| 7 | Product Backlog | `docs/PRODUCT-BACKLOG.md` |
| 8 | Use Case Diagram | `docs/DIAGRAMS.md` |
| 9 | Class Diagram | `docs/DIAGRAMS.md` |
| 10 | Sequence Diagram | `docs/DIAGRAMS.md` |
| 11 | Activity Diagram | `docs/DIAGRAMS.md` |
| 12 | Component Diagram | `docs/DIAGRAMS.md` |
| 13 | Deployment Diagram | `docs/DIAGRAMS.md` |
| 14 | ER diagram / DB schema | `docs/ERD.md`, `apps/api/prisma/schema.prisma` |
| 15 | Git repository, README, .gitignore | `README.md`, `.gitignore` |
| 16 | Git Flow / Conventional Commits | `docs/GIT-FLOW.md` |
| 17 | CI/CD pipeline | `.github/workflows/ci.yml` (install → lint → typecheck → test → build) |
| 18 | Green build evidence | `docs/CI-BUILD-LOG.md` (reproducible green run) + GitHub Actions |
| 19 | Automated tests | `apps/api/src/**/*.test.ts` (8 tests) |
| 20 | Manual test report | `docs/TEST-REPORT.md` |
| 21 | Static analysis | ESLint (`eslint.config.mjs`, `npm run lint`) + `npm run typecheck` |
| 22 | Release tag v0.1.0 / notes | git tag `v0.1.0` + `docs/RELEASE-NOTES-v0.1.0.md` |
| 23 | Deployed app / one-step start | `README.md` (`npm run dev`) |
| 24 | Deployment Guide | `docs/DEPLOYMENT-GUIDE.md` |
| 25 | Defense presentation | `docs/PRESENTATION.md` (slides) + `docs/PRESENTATION-OUTLINE.md` |
