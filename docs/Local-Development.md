# Local Development Setup

## The Problem

When running `npm run dev` with Vite, the frontend runs on `http://localhost:5173`, but your API routes (`/api/*`) are **Vercel serverless functions** that Vite doesn't know how to run.

This causes 404 errors when the frontend tries to call `/api/create-mesh`.

## The Solution

Use **Vercel CLI** for local development. It runs both:
1. Your Vite frontend (React app)
2. Your API functions (Vercel serverless functions)

## Setup Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Your Project (First Time Only)

```bash
vercel link
```

Follow the prompts:
- Set up and link existing project? **Yes**
- Link to existing project? **Yes** (or create new)
- What's your project's name? **image-to-3d** (or your choice)

### 4. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:

```bash
# Tripo API Configuration
TRIPO_API_BASE=https://api.tripo3d.ai/v2/openapi
TRIPO_API_KEY=your_actual_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# Image Upload Limits
MAX_IMAGE_BYTES=10000000

# Development Mode
DEV_MODE_BYPASS_LIMITS=true

# Fallback Configuration
FALLBACK_THRESHOLD_MS=16000
DISABLE_FALLBACK=true
```

**Important:** Vercel CLI reads from `.env.local` automatically.

### 5. Run Development Server

```bash
npm run dev
```

This will:
- Start Vite dev server (frontend) on one port
- Start Vercel dev server (API functions) on port 3000
- Automatically proxy API requests from frontend → backend

## Access Your App

Open your browser to:
```
http://localhost:3000
```

**Note:** The port might be different - check the terminal output.

## Testing the API

### Test Create Mesh Endpoint

```bash
curl -X POST http://localhost:3000/api/create-mesh \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

### Test Status Endpoint

```bash
curl http://localhost:3000/api/status?id=YOUR_TASK_ID
```

## Common Issues

### "API still returns 404"

**Solution:** Make sure you're accessing the app through the Vercel dev server URL (usually `http://localhost:3000`), not the Vite dev server URL (`http://localhost:5173`).

### "Environment variables not working"

**Solution:**
1. Check that `.env.local` exists in the project root
2. Restart the dev server: `Ctrl+C` then `npm run dev`
3. Verify variables are loaded: Check server logs

### "Port 3000 already in use"

**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
vercel dev --listen 3001
```

### "Vercel CLI not found"

**Solution:**
```bash
npm install -g vercel
```

## Alternative: Vite Only (Frontend Only)

If you want to develop frontend only without API:

```bash
npm run dev:vite
```

This runs only the Vite dev server on `http://localhost:5173`, but API calls will fail.

## Production Build

To test production build locally:

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

This runs the production build, but **API functions won't work** (they need Vercel).

## File Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── create-mesh.ts     # POST /api/create-mesh
│   ├── status.ts          # GET /api/status
│   └── _shared.ts         # Shared utilities
├── src/                   # React frontend (Vite)
│   ├── App.tsx
│   └── ...
├── .env.local            # Local environment variables
├── vercel.json           # Vercel configuration
└── package.json
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Run Vercel dev server (frontend + API) |
| `npm run dev:vite` | Run Vite only (frontend only, no API) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Debugging

Enable verbose logging:

```bash
vercel dev --debug
```

Check which port Vercel is using:

```bash
# Look for this line in terminal output:
> Ready! Available at http://localhost:3000
```

## Summary

✅ **For full-stack development:** Use `npm run dev` (Vercel CLI)
❌ **Don't use:** `npm run dev:vite` (API won't work)
