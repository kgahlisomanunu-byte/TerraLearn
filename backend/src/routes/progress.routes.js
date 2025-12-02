import express from 'express';
import {
  getUserProgress,
  getLessonProgress,
  getQuizProgress,
  getProgressOverview,
  getLeaderboard,
  exportProgress
} from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateId, validatePagination } from '../utils/validate.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User progress
router.get('/', validatePagination, getUserProgress);
router.get('/overview', getProgressOverview);
router.get('/export', exportProgress);

// Specific progress
router.get('/lesson/:lessonId', getLessonProgress);
router.get('/quiz/:quizId', getQuizProgress);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;