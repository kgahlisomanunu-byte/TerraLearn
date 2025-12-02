import User from '../models/User.model.js';
import Lesson from '../models/Lesson.model.js';
import Quiz from '../models/Quiz.model.js';
import GeoPoint from '../models/GeoPoint.model.js';
import Progress from '../models/Progress.model.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalLessons,
      totalQuizzes,
      totalGeoPoints,
      activeUsers,
      publishedLessons
    ] = await Promise.all([
      User.countDocuments(),
      Lesson.countDocuments(),
      Quiz.countDocuments(),
      GeoPoint.countDocuments(),
      User.countDocuments({ isActive: true }),
      Lesson.countDocuments({ isPublished: true })
    ]);

    // Get recent activity
    const recentProgress = await Progress.find()
      .populate('user', 'name')
      .populate('lesson', 'title')
      .populate('quiz', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user growth
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get content statistics
    const lessonsByDifficulty = await Lesson.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 }
        }
      }
    ]);

    const geoPointsByType = await GeoPoint.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get platform performance
    const quizPerformance = await Progress.aggregate([
      {
        $match: { quiz: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
          passRate: {
            $avg: { $cond: [{ $gte: ["$score", 70] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalLessons,
          totalQuizzes,
          totalGeoPoints,
          activeUsers,
          publishedLessons
        },
        recentActivity: recentProgress,
        userGrowth,
        contentStats: {
          lessonsByDifficulty,
          geoPointsByType
        },
        performance: quizPerformance[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // User engagement
    const userEngagement = await Progress.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          activeUsers: { $addToSet: "$user" },
          totalActivities: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          activeUsersCount: { $size: "$activeUsers" },
          totalActivities: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    // User retention
    const userCohorts = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          users: { $push: "$_id" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Platform usage patterns
    const usagePatterns = await Progress.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" },
            dayOfWeek: { $dayOfWeek: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        userEngagement,
        userCohorts,
        usagePatterns
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getContentAnalytics = async (req, res, next) => {
  try {
    // Most popular lessons
    const popularLessons = await Progress.aggregate([
      {
        $match: { lesson: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: "$lesson",
          completions: { $sum: 1 },
          averageTimeSpent: { $avg: "$timeSpent" }
        }
      },
      { $sort: { completions: -1 } },
      { $limit: 10 }
    ]);

    // Populate lesson details
    const popularLessonsWithDetails = await Lesson.populate(popularLessons, {
      path: '_id',
      select: 'title duration difficulty'
    });

    // Quiz performance analytics
    const quizAnalytics = await Progress.aggregate([
      {
        $match: { quiz: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: "$quiz",
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
          passRate: {
            $avg: { $cond: [{ $gte: ["$score", 70] }, 1, 0] }
          }
        }
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 }
    ]);

    // Populate quiz details
    const quizAnalyticsWithDetails = await Quiz.populate(quizAnalytics, {
      path: '_id',
      select: 'title lesson'
    });

    // Content completion rates
    const contentCompletion = await Progress.aggregate([
      {
        $facet: {
          lessons: [
            { $match: { lesson: { $exists: true, $ne: null } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: ["$completed", 1, 0] } }
              }
            }
          ],
          quizzes: [
            { $match: { quiz: { $exists: true, $ne: null } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                passed: { $sum: { $cond: ["$passed", 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        popularLessons: popularLessonsWithDetails,
        quizAnalytics: quizAnalyticsWithDetails,
        contentCompletion: {
          lessonCompletionRate: contentCompletion[0].lessons[0] 
            ? (contentCompletion[0].lessons[0].completed / contentCompletion[0].lessons[0].total) * 100 
            : 0,
          quizPassRate: contentCompletion[0].quizzes[0] 
            ? (contentCompletion[0].quizzes[0].passed / contentCompletion[0].quizzes[0].total) * 100 
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadContent = async (req, res, next) => {
  try {
    const { type, data } = req.body;

    if (!type || !data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Type and data array are required'
      });
    }

    let result;
    
    switch (type) {
      case 'lessons':
        result = await Lesson.insertMany(data.map(lesson => ({
          ...lesson,
          createdBy: req.user.id
        })));
        break;
      
      case 'quizzes':
        result = await Quiz.insertMany(data.map(quiz => ({
          ...quiz,
          createdBy: req.user.id
        })));
        break;
      
      case 'geopoints':
        result = await GeoPoint.insertMany(data.map(geoPoint => ({
          ...geoPoint,
          createdBy: req.user.id
        })));
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
    }

    res.status(201).json({
      success: true,
      message: `${result.length} ${type} uploaded successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const exportDatabase = async (req, res, next) => {
  try {
    const { collections = 'all' } = req.query;
    const exportData = {};

    const availableCollections = {
      users: User,
      lessons: Lesson,
      quizzes: Quiz,
      geopoints: GeoPoint,
      progress: Progress
    };

    const collectionsToExport = collections === 'all' 
      ? Object.keys(availableCollections)
      : collections.split(',');

    for (const collection of collectionsToExport) {
      if (availableCollections[collection]) {
        const data = await availableCollections[collection].find().lean();
        exportData[collection] = data;
      }
    }

    res.status(200).json({
      success: true,
      data: exportData,
      exportedAt: new Date(),
      totalCollections: Object.keys(exportData).length
    });
  } catch (error) {
    next(error);
  }
};