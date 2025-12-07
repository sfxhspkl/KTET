# KTET Quiz Application

A comprehensive quiz application for KTET (Kerala Teacher Eligibility Test) preparation with MongoDB backend and React frontend.

## Features

- **User Authentication**: Secure login and signup with JWT
- **Role-Based Access**: Separate dashboards for students and admins
- **Quiz System**: Interactive quiz interface with timer and progress tracking
- **Admin Panel**: Manage questions, subjects, topics, users, and notifications
- **Progress Tracking**: Track quiz history and performance analytics
- **Messaging System**: Communication between users and admins
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Lucide React (icons)
- Recharts (analytics)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs (password hashing)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ktet_Quiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ktet_quiz?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   PORT=3001
   ```

   Replace `username`, `password`, and `cluster` with your MongoDB Atlas credentials.

4. **Seed the database**
   ```bash
   npm run seed
   ```

   This will populate your MongoDB database with initial data including:
   - Default users (user/user and admin/admin)
   - Subjects for all 3 categories
   - Sample questions
   - Topics and syllabus items

### Development

Run the development servers:

**Terminal 1 - Backend API:**
```bash
npm run dev:api
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

### Default Credentials

- **Student**: username: `user`, password: `user`
- **Admin**: username: `admin`, password: `admin`

## Deployment to Vercel

### Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster if you haven't already
3. Go to **Database Access** and create a database user
4. Go to **Network Access** and add `0.0.0.0/0` to allow connections from anywhere (for Vercel)
5. Get your connection string from **Database** → **Connect** → **Connect your application**

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A strong random string
     - `NODE_ENV`: `production`

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Step 3: Seed Production Database

After deployment, you need to seed your production database:

1. Update your `.env` file with the production MongoDB URI
2. Run the seed script:
   ```bash
   npm run seed
   ```

Alternatively, you can create a one-time Vercel function to seed the database.

## Project Structure

```
ktet_Quiz/
├── api/                    # Backend API
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── Subject.js
│   │   ├── Topic.js
│   │   ├── QuizLog.js
│   │   ├── IssueReport.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── Syllabus.js
│   ├── index.js           # Express server & routes
│   └── seed.js            # Database seeding script
├── components/            # React components
├── services/              # API service layer
│   └── api.ts            # Axios API client
├── App.tsx               # Main application component
├── types.ts              # TypeScript type definitions
├── constants.ts          # Application constants
├── vercel.json           # Vercel configuration
├── package.json
└── .env.example          # Environment variables template
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/usage` - Update usage time

### Questions
- `GET /api/questions` - Get questions (with filters)
- `POST /api/questions` - Create question (admin)
- `PUT /api/questions/:id` - Update question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)

### Quiz
- `GET /api/quiz/history/:userId` - Get quiz history
- `POST /api/quiz/complete` - Save quiz results

### Other Endpoints
- Subjects, Topics, Reports, Messages, Notifications, Syllabus

See `api/index.js` for complete API documentation.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | API server port | No (default: 3001) |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For issues and questions, please create an issue in the GitHub repository.
