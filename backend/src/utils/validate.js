import { body, param, query } from 'express-validator';

// Auth validations
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'learner'])
    .withMessage('Role must be admin, teacher, or learner')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// User validations
export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('gradeLevel')
    .optional()
    .isIn(['Grade 10', 'Grade 11', 'Grade 12'])
    .withMessage('Grade level must be Grade 10, 11, or 12')
];

// Lesson validations
export const validateCreateLesson = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Lesson title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Lesson description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('content')
    .notEmpty()
    .withMessage('Lesson content is required'),
  
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  
  body('topics')
    .optional()
    .isArray()
    .withMessage('Topics must be an array'),
  
  body('learningObjectives')
    .optional()
    .isArray()
    .withMessage('Learning objectives must be an array')
];

export const validateUpdateLesson = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced')
];

// Quiz validations
export const validateCreateQuiz = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Quiz title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('lesson')
    .isMongoId()
    .withMessage('Valid lesson ID is required'),
  
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Quiz must have at least one question'),
  
  body('questions.*.question')
    .notEmpty()
    .withMessage('Question text is required'),
  
  body('questions.*.options')
    .isArray({ min: 2 })
    .withMessage('Each question must have at least 2 options'),
  
  body('questions.*.correctAnswer')
    .isInt({ min: 0 })
    .withMessage('Correct answer must be a valid index'),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time limit must be at least 1 minute'),
  
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100')
];

// GeoPoint validations
export const validateCreateGeoPoint = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('type')
    .isIn(['landmark', 'terrain', 'historical', 'cultural', 'climate', 'economic', 'political'])
    .withMessage('Invalid geo point type'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Progress validations
export const validateSubmitQuiz = [
  body('quizId')
    .isMongoId()
    .withMessage('Valid quiz ID is required'),
  
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  
  body('answers.*.questionIndex')
    .isInt({ min: 0 })
    .withMessage('Question index must be a valid number'),
  
  body('answers.*.selectedAnswer')
    .isInt({ min: 0 })
    .withMessage('Selected answer must be a valid index'),
  
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number')
];

// ID parameter validation
export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Query parameter validations
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];