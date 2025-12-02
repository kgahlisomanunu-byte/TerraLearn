import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import lessonRoutes from './src/routes/lesson.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';
import geoRoutes from './src/routes/geo.routes.js';
import progressRoutes from './src/routes/progress.routes.js';

// Middleware
import errorMiddleware from './src/middleware/error.middleware.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/progress', progressRoutes);

// Error handling middleware
app.use(errorMiddleware);

export default app;