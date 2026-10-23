🇬🇧 English | [🇫🇷 Français](README.fr.md)

# ai-bookshelf

AI-Bookshelf is an open-source app that turns AI-assisted learning conversations into structured, searchable study notes.

I learn a lot using conversational AIs — sometimes ChatGPT, sometimes Claude, or others. But I would never go back and reread my conversations across all the different models I used. So I built an app to gather the conversations on the topics I want to revisit.

> **Note:** the app interface and the AI prompts are currently in French, so the AI will write your study notes and quizzes in French.

## How does it work?

1. Learn a topic with any conversational AI: ask for a course outline, ask questions, dig into the details.
2. In AI-Bookshelf, click **Importer un JSON**, then **Copier le prompt**, and paste that prompt into your conversation. The AI answers with a summary of the course in JSON (Markdown content, with Mermaid diagrams when useful).
3. Paste the JSON into the import window, pick a category: your study note is created.

## Features

- Study notes rendered from Markdown, with Mermaid diagrams, organized by category
- Clickable table of contents for long notes, highlighting the section being read
- Section-by-section editing to add a clarification without rewriting the whole note
- Copy a note as JSON, have an AI correct it, then replace the note with the corrected JSON
- Quiz prompts to practice with an AI: multiple choice first, then open questions
- PDF export

## Installation

The only requirement is [Docker](https://docs.docker.com/get-docker/) (Docker Desktop on macOS and Windows), running.

```bash
git clone https://github.com/Crv113/ai-bookshelf.git
cd ai-bookshelf
make up
```

The app is then available at **http://ai-bookshelf.localhost:8737** (or http://localhost:8737 if your browser doesn't resolve `*.localhost`, e.g. Safari). It restarts automatically with Docker: no need to run `make up` again after a reboot.

To use another port, copy `.env.example` to `.env` and change `APP_PORT`.

### Commands

| Command | Description |
|---|---|
| `make up` | Install, start or update the app (backs up the database first when it already exists) |
| `make down` | Stop the app (data is kept) |
| `make logs` | Follow the app logs |
| `make backup` | Dump the database into `backups/` |
| `make restore FILE=backups/xxx.sql` | Replace the database with a backup (asks for confirmation) |
| `make dev` | Development mode: Spring Boot (8081) + Vite (5737) with hot reload — requires Java 21 and Node 20+ |
| `make dev-restore` | Replace the development database with a fresh copy of the app database |
| `make test` | Run backend and frontend tests — requires Java 21 and Node 20+ |

Without `make` (e.g. on Windows without WSL), use Docker Compose directly:

```bash
docker compose up -d --build   # start or update
docker compose down            # stop
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' > backup.sql
```

### How it runs

- `db`: PostgreSQL 18, data stored in the `ai-bookshelf_db-data` Docker volume, not exposed outside Docker.
- `app`: a single Spring Boot container that serves both the API (`/api`) and the built React frontend, exposed on `127.0.0.1` only.
- `make dev` uses a separate development database (`compose.dev.yaml`), so it never touches your real data. On first run it is filled with a copy of the app database; `make dev-restore` refreshes that copy. The development frontend shows a "DEV" watermark and badge.
