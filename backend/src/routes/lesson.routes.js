import express from 'express';
import {
  createLesson,
  getLessons,
  getLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  getRecommendedLessons,
  searchLessons,
  getLessonStatistics
} from '../controllers/lesson.controller.js';
import { protect, isTeacher } from '../middleware/auth.middleware.js';
import { 
  validateCreateLesson, 
  validateUpdateLesson, 
  validateId,
  validatePagination,
  validateSearch
} from '../utils/validate.js';

const router = express.Router();

// Public routes
router.get('/', validatePagination, getLessons);
router.get('/search', validateSearch, searchLessons);
router.get('/:id', validateId, getLesson);

// Protected routes
router.use(protect);

router.post('/:id/complete', validateId, completeLesson);
router.get('/:id/statistics', validateId, getLessonStatistics);

// Teacher/Admin routes
router.use(isTeacher);

router.post('/', validateCreateLesson, createLesson);
router.get('/recommended', getRecommendedLessons);

router.put('/:id', validateId, validateUpdateLesson, updateLesson);
router.delete('/:id', validateId, deleteLesson);

export default router;