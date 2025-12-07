# Fixing Port 3001 Already in Use

## The Problem
Port 3001 is already being used by another process (PID: 16136).

## Solution 1: Kill the Process (Recommended)

Run this command to stop the process using port 3001:

```powershell
taskkill /PID 16136 /F
```

Then start the API server:
```bash
npm run dev:api
```

## Solution 2: Use a Different Port

1. Update your `.env` file:
   ```env
   PORT=3002
   ```

2. Update `services/api.ts` line 4:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
   ```

3. Start the API server:
   ```bash
   npm run dev:api
   ```

## After Starting API Server

You should see:
```
MongoDB connected successfully
Server running on port 3001
```

Then in another terminal, run:
```bash
npm run dev
```

And open http://localhost:5173 in your browser.

## Quick Test

Once both servers are running, test the API:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{"status":"ok","message":"KTET Quiz API is running"}
```
