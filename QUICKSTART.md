# Quick Start Guide

## You need to run TWO servers:

### Option 1: Two Terminals (Recommended for Development)

**Terminal 1 - API Server:**
```bash
npm run dev:api
```
This starts the backend API on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
npm run dev
```
This starts the frontend on http://localhost:5173

### Option 2: Single Command (Install concurrently first)

```bash
npm install --save-dev concurrently
```

Then update package.json scripts to:
```json
"dev:all": "concurrently \"npm run dev:api\" \"npm run dev\""
```

Then run:
```bash
npm run dev:all
```

## Important Steps Before Running:

1. **Create .env file** with your MongoDB connection:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ktet_quiz
   JWT_SECRET=your-secret-key
   NODE_ENV=development
   PORT=3001
   ```

2. **Seed the database** (only once):
   ```bash
   npm run seed
   ```

3. **Start both servers** (see options above)

4. **Open browser** to http://localhost:5173

## Current Issue:

You're only running `npm run dev` which starts the frontend.
You ALSO need to run `npm run dev:api` in a separate terminal to start the backend API server.

The 404 errors are because the API server at port 3001 is not running.
