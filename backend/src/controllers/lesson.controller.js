import { LessonService } from '../services/lesson.service.js';
import { validationResult } from 'express-validator';

export const createLesson = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const lesson = await LessonService.createLesson(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

export const getLessons = async (req, res, next) => {
  try {
    const result = await LessonService.getLessons(req.query, req.user);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (req, res, next) => {
  try {
    const result = await LessonService.getLessonById(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const lesson = await LessonService.updateLesson(
      req.params.id,
      req.body,
      req.user
    );
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    await LessonService.deleteLesson(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const completeLesson = async (req, res, next) => {
  try {
    const progress = await LessonService.completeLesson(
      req.params.id,
      req.user.id
    );
    
    res.status(200).json({
      success: true,
      data: progress,
      message: 'Lesson marked as completed'
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedLessons = async (req, res, next) => {
  try {
    const lessons = await LessonService.getRecommendedLessons(req.user.id);
    
    res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    next(error);
  }
};

export const searchLessons = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    const result = await Lesson.find(
      { 
        $text: { $search: q },
        isPublished: true 
      },
      { score: { $meta: "textScore" } }
    )
    .populate('createdBy', 'name')
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Lesson.countDocuments({ 
      $text: { $search: q },
      isPublished: true 
    });

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get total completions
    const completions = await Progress.countDocuments({
      lesson: id,
      completed: true
    });

    // Get average completion time
    const avgTime = await Progress.aggregate([
      { $match: { lesson: mongoose.Types.ObjectId(id), completed: true } },
      { $group: { _id: null, avgTime: { $avg: "$timeSpent" } } }
    ]);

    // Get progress by day
    const progressByDay = await Progress.aggregate([
      { $match: { lesson: mongoose.Types.ObjectId(id), completed: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        completions,
        averageCompletionTime: avgTime[0]?.avgTime || 0,
        progressByDay
      }
    });
  } catch (error) {
    next(error);
  }
};