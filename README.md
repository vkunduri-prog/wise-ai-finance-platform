# WISE

WISE is a US-focused AI-assisted financial planning platform for two user groups:
- first-time investors who need education, budgeting structure, and safer starter recommendations
- active earners and investors who need portfolio guidance, market-aware recommendations, and FIRE planning

The current codebase includes:
- FastAPI backend
- Next.js frontend
- MySQL persistence
- synthetic user-data generation
- ML-assisted investor classification
- market snapshot ingestion and ranking
- portfolio recommendation, drift analysis, and FIRE planning

## Stack

- Frontend: Next.js 14 + React 18
- Backend: FastAPI + SQLAlchemy
- Database: MySQL 8
- ML: scikit-learn + joblib
- Market data pipeline: `yfinance`

## Product Features

- signup and login
- saved user financial profiles
- saved holdings and financial goals
- personalized portfolio recommendations
- explanation and learning notes
- FIRE calculator and progress tracking
- portfolio gap insights
- allocation drift and rebalance guidance
- market snapshot sync into MySQL

## Repository Layout

- [backend](/D:/Capstone/finpilot-starter/backend)
- [frontend](/D:/Capstone/finpilot-starter/frontend)
- [data](/D:/Capstone/finpilot-starter/data)
- [mysql](/D:/Capstone/finpilot-starter/mysql)

## Local Setup

### 1. Start MySQL

```bash
cd mysql
docker compose up -d
```

### 2. Configure backend

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your backend env file:

```bash
copy .env.example .env
```

Set at minimum:
- `DATABASE_URL`
- `AUTH_SALT`
- `CORS_ORIGINS`

### 3. Configure frontend

```bash
cd ../frontend
npm install
```

Create frontend env file:

```bash
copy .env.local.example .env.local
```

Set:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

### 4. Generate synthetic training data

```bash
cd ../backend
python scripts/generate_data.py --rows 20000 --out ../data/users.csv
```

### 5. Train the recommendation model

```bash
python scripts/train_model.py --data ../data/users.csv --out app/ml_artifacts
```

### 6. Refresh market dataset CSV

```bash
python scripts/fetch_market_data.py --start 2024-01-01 --out ../data/market_universe.csv
```

### 7. Run backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 8. Run frontend

```bash
cd ../frontend
npm run dev
```

Frontend:
- `http://localhost:3000`

Backend:
- `http://localhost:8000`

API docs:
- `http://localhost:8000/docs`

## Suggested First-Run Flow

1. Start MySQL
2. Start backend
3. Start frontend
4. Create an account in the dashboard
5. Save a financial profile
6. Add holdings and goals
7. Generate a recommendation
8. Run the FIRE planner
9. Click `Sync Market To DB` to persist market snapshots

## Important Backend Notes

- The app auto-creates tables on startup.
- The app also applies a lightweight runtime schema patch for one evolving recommendation column.
- Auth is token-based and intended for capstone/demo use, not production-grade security.
- Market snapshots can be read from CSV immediately, then synced into MySQL for history.

## Key API Endpoints

Auth:
- `POST /auth/signup`
- `POST /auth/login`

Profiles and user data:
- `POST /profiles`
- `GET /profiles/{user_id}/latest`
- `POST /holdings`
- `GET /holdings/{user_id}`
- `POST /goals`
- `GET /goals/{user_id}`

Recommendations and planning:
- `POST /recommendations`
- `GET /recommendations/{user_id}/latest`
- `POST /learn-path`
- `POST /fire-plans`
- `GET /dashboard/{user_id}`

Market:
- `GET /market/snapshot`
- `POST /market/sync`

Health:
- `GET /health`

## Free Hosting Direction

Recommended capstone deployment path:
- frontend: Vercel
- backend: Render or Railway
- database: Railway MySQL or another hosted MySQL provider

Stack-specific deployment guide:
- [DEPLOYMENT.md](/D:/Capstone/finpilot-starter/DEPLOYMENT.md)

Before deploying:
- replace `AUTH_SALT`
- set production `CORS_ORIGINS`
- set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL
- run a market sync after deployment

## Known Limitations

- auth is lightweight and does not yet include token expiry or revocation
- passwords use SHA-256 with a configured salt instead of a stronger production password hasher
- market sync stores snapshots but does not yet run on a scheduler
- drift analysis is asset-class level, not full ticker-level optimization

## Educational Note

This project is for educational and decision-support purposes only. It does not provide regulated financial advice.
