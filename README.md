# CareerBridge — Quick Start

## Prerequisites

- **Node.js 20+**
- **Python 3.11+** (PDF extraction; venv in `python-service/`)
- **MongoDB Community Server** running on `127.0.0.1:27017`

## 1. Install dependencies

```bash
npm run install-all
```

## 2. Environment

`backend/.env` must include:

```
MONGO_URI=mongodb://127.0.0.1:27017/ai-careerbridge
```

Keep `PYTHON_SERVICE_API_KEY` the same in `backend/.env` and `python-service/.env`.

## 3. Start MongoDB

Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) if needed, then start the **MongoDB** Windows service.

Verify:

```bash
npm run test:db --prefix backend
```

## 4. Seed demo user (optional)

```bash
npm run setup
```

| Email | Password |
|-------|----------|
| `demo@aicareerbridge.com` | `Demo@123456` |

## 5. Run the app

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Python PDF service | http://localhost:8000 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend + backend + Python |
| `npm run setup` | Seed demo user |
| `npm test` | Backend tests |
