# Deployment Guide

This guide targets:
- frontend on Vercel
- backend on Render
- MySQL on Railway

## Architecture

- Vercel serves the Next.js app from [frontend](/D:/Capstone/finpilot-starter/frontend)
- Render serves the FastAPI backend from [backend](/D:/Capstone/finpilot-starter/backend)
- Railway hosts the MySQL database used by SQLAlchemy

## 1. Railway MySQL

Create a Railway project and add a MySQL database service. After Railway provisions the database, copy the connection details and build a SQLAlchemy connection string in this form:

```text
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Set that value as `DATABASE_URL` in Render for the backend.

## 2. Render Backend

This repo includes a Render blueprint at [render.yaml](/D:/Capstone/finpilot-starter/render.yaml).

### Render service settings

- Service type: `Web Service`
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

### Required Render environment variables

- `DATABASE_URL`
- `AUTH_SALT`
- `CORS_ORIGINS`

### Recommended Render environment variables

- `APP_ENV=production`
- `APP_NAME=FinPilot API`
- `APP_VERSION=0.0.1`
- `MODEL_PATH=app/ml_artifacts/recommender.joblib`

### CORS value

After Vercel gives you the frontend URL, set:

```text
CORS_ORIGINS=https://your-vercel-project.vercel.app
```

If you also want local testing after deploy, include both:

```text
https://your-vercel-project.vercel.app,http://localhost:3000
```

## 3. Vercel Frontend

Import the repo into Vercel and set the project root directory to `frontend`.

### Vercel project settings

- Framework preset: `Next.js`
- Root directory: `frontend`
- Build command: default
- Output directory: default

### Required Vercel environment variable

Set:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com
```

Redeploy after setting it.

## 4. First Production Startup

After both apps are deployed:

1. Open the frontend.
2. Create a user account.
3. Save a financial profile.
4. Click `Sync Market To DB` once.
5. Generate a recommendation.
6. Add holdings and goals.
7. Run the FIRE planner.

## 5. Deployment Checklist

- `DATABASE_URL` points to Railway MySQL
- `AUTH_SALT` is long and random
- `CORS_ORIGINS` matches the Vercel production URL
- `NEXT_PUBLIC_API_BASE_URL` matches the Render backend URL
- backend health endpoint responds at `/health`
- frontend can sign up and log in
- dashboard can save profile, holdings, goals, recommendation, FIRE plan
- market sync succeeds once after deploy

## 6. Operational Notes

- Render free instances can spin down when idle, so the first backend request may be slow.
- If Railway rotates credentials, update `DATABASE_URL` in Render.
- If you change the frontend domain, update `CORS_ORIGINS` in Render.
- If you retrain the model, redeploy Render so the new `recommender.joblib` is included.

## 7. Current Security Note

This project uses lightweight session-token auth intended for demo and capstone use. Before any real production usage, upgrade:

- password hashing
- token expiration and revocation
- HTTPS/domain/session policy
- secrets management
