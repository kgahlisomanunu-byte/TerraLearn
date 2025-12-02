import Lesson from '../models/Lesson.model.js';
import Progress from '../models/Progress.model.js';
import mongoose from 'mongoose';

export class LessonService {
  // Create new lesson
  static async createLesson(lessonData, createdBy) {
    const lesson = await Lesson.create({
      ...lessonData,
      createdBy
    });

    return lesson;
  }

  // Get all lessons with filtering and pagination
  static async getLessons(query = {}, user = null) {
    const { 
      page = 1, 
      limit = 10, 
      gradeLevel, 
      difficulty, 
      topic, 
      search,
      publishedOnly = true 
    } = query;

    const skip = (page - 1) * limit;

    const filter = {};

    // Only show published lessons to non-admins
    if (publishedOnly && (!user || user.role === 'learner')) {
      filter.isPublished = true;
    }

    if (gradeLevel) {
      filter.gradeLevel = gradeLevel;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (topic) {
      filter.topics = { $in: [topic] };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const lessons = await Lesson.find(filter)
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lesson.countDocuments(filter);

    return {
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get single lesson by ID
  static async getLessonById(lessonId, user = null) {
    const lesson = await Lesson.findById(lessonId)
      .populate('createdBy', 'name email')
      .populate('prerequisites', 'title description');

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if user can access the lesson
    if (!lesson.isPublished && (!user || (user.role !== 'admin' && user.role !== 'teacher'))) {
      throw new Error('Lesson not available');
    }

    // Get user progress for this lesson if user is logged in
    let userProgress = null;
    if (user) {
      userProgress = await Progress.findOne({
        user: user._id,
        lesson: lessonId
      });
    }

    return {
      lesson,
      userProgress
    };
  }

  // Update lesson
  static async updateLesson(lessonId, updateData, user) {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if user has permission to update
    if (user.role !== 'admin' && lesson.createdBy.toString() !== user._id.toString()) {
      throw new Error('Not authorized to update this lesson');
    }

    const allowedUpdates = [
      'title', 'description', 'content', 'duration', 'resources', 
      'topics', 'difficulty', 'isPublished', 'order', 'learningObjectives',
      'prerequisites', 'thumbnail'
    ];

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        lesson[key] = updateData[key];
      }
    });

    await lesson.save();
    return lesson;
  }

  // Delete lesson
  static async deleteLesson(lessonId, user) {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if user has permission to delete
    if (user.role !== 'admin' && lesson.createdBy.toString() !== user._id.toString()) {
      throw new Error('Not authorized to delete this lesson');
    }

    // Check if lesson has associated quizzes or progress
    const hasQuizzes = await mongoose.model('Quiz').exists({ lesson: lessonId });
    const hasProgress = await Progress.exists({ lesson: lessonId });

    if (hasQuizzes || hasProgress) {
      throw new Error('Cannot delete lesson with associated quizzes or progress records');
    }

    await Lesson.findByIdAndDelete(lessonId);
    return lesson;
  }

  // Mark lesson as completed
  static async completeLesson(lessonId, userId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    let progress = await Progress.findOne({
      user: userId,
      lesson: lessonId
    });

    if (progress) {
      progress.completed = true;
      progress.completedAt = new Date();
      await progress.save();
    } else {
      progress = await Progress.create({
        user: userId,
        lesson: lessonId,
        completed: true,
        completedAt: new Date()
      });
    }

    // Create notification
    await Notification.createNotification(userId, {
      title: 'Lesson Completed!',
      message: `You've completed the lesson: ${lesson.title}`,
      type: 'lesson',
      relatedEntity: {
        entityType: 'lesson',
        entityId: lessonId
      },
      actionUrl: `/lessons/${lessonId}`
    });

    return progress;
  }

  // Get lesson recommendations based on user progress
  static async getRecommendedLessons(userId, limit = 5) {
    const userProgress = await Progress.find({ user: userId })
      .populate('lesson', 'topics difficulty');

    const completedTopics = new Set();
    const completedDifficulties = new Set();

    userProgress.forEach(progress => {
      if (progress.lesson) {
        progress.lesson.topics.forEach(topic => completedTopics.add(topic));
        completedDifficulties.add(progress.lesson.difficulty);
      }
    });

    const recommendations = await Lesson.find({
      isPublished: true,
      _id: { $nin: userProgress.map(p => p.lesson) },
      $or: [
        { topics: { $in: Array.from(completedTopics) } },
        { difficulty: { $in: Array.from(completedDifficulties) } }
      ]
    })
    .limit(limit)
    .sort({ createdAt: -1 });

    return recommendations;
  }
}