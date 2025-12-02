import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  updateMe, 
  deleteMe, 
  changePassword 
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRegister, validateLogin, validateUpdateProfile } from '../utils/validate.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', validateUpdateProfile, updateMe);
router.delete('/me', deleteMe);
router.put('/change-password', changePassword);

export default router;