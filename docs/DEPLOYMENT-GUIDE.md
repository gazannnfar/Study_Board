# Deployment Guide

## Frontend: Vercel

1. Import repository.
2. Set root command to build workspace: `npm run build`.
3. Set environment variable: `VITE_API_URL=https://your-api.example.com/api`.
4. Deploy `apps/web/dist`.

## Backend: Railway or Render

1. Create PostgreSQL database.
2. Set environment variables from `apps/api/.env.example`.
3. Build command: `npm install && npm --workspace apps/api run db:generate && npm --workspace apps/api run build`.
4. Start command: `npm --workspace apps/api run start`.
5. Run migrations: `npm --workspace apps/api run db:deploy`.

## Local One-Step Demo After Setup

```bash
npm run dev
```
