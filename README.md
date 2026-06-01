# PaperPanda Render Deployment

This repo is structured for a Render deployment with a separate frontend and backend.

## Structure

```text
frontend/   Vite-based student dashboard
backend/    Express API for PDF parsing, Ask AI, and Listen AI voice
render.yaml Render blueprint for both services
```

## What moved to the backend

- `POST /api/upload/pdf`
  - parses uploaded PDFs
  - extracts page text
  - renders each page as an image data URL

- `POST /api/ask`
  - sends subject/document context to OpenAI Responses API
  - returns a real AI answer

- `POST /api/speak`
  - sends text to OpenAI text-to-speech
  - returns natural female voice audio

## Local development

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Set these values locally before starting:

- `frontend/.env`
  - `VITE_API_BASE_URL=http://localhost:3001`

- `backend/.env`
  - `OPENAI_API_KEY=...`
  - `FRONTEND_ORIGIN=http://localhost:5173`
  - `DATABASE_URL=postgresql://...`

## Render deployment

This repo includes `render.yaml`.

Expected services:

1. `paperpanda-frontend`
   - Render Static Site
   - root directory: `frontend`

2. `paperpanda-api`
   - Render Web Service
   - root directory: `backend`

You can either:

- create both services manually in Render, or
- use `render.yaml` as a Blueprint

## Notes

- The old `file://` prototype hit browser restrictions for PDF.js workers and direct OpenAI browser requests.
- This structure moves those sensitive and restricted operations to the backend where they belong.
- Shared sign-in and cross-device subject sync now use Postgres on the backend instead of browser-only local storage.
- The auth store uses dedicated `paperpanda_users` and `paperpanda_sessions` tables inside PaperPanda's own Postgres database.
- The backend automatically imports the legacy JSON auth store on first boot if `paperpanda-store.json` exists and the Postgres auth tables are empty.
- The included `render.yaml` now defines a dedicated `paperpanda-db` Render Postgres instance and wires `paperpanda-api` to it automatically.
- PaperPanda should not share a database with Wallspace or any other app. Keep the PaperPanda data isolated in its own Render Postgres instance.
