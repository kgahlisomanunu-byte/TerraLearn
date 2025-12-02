import Progress from '../models/Progress.model.js';
import Lesson from '../models/Lesson.model.js';
import Quiz from '../models/Quiz.model.js';

export const getUserProgress = async (req, res, next) => {
  try {
    const { userId = req.user.id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    
    if (type === 'lesson') {
      filter.lesson = { $exists: true, $ne: null };
    } else if (type === 'quiz') {
      filter.quiz = { $exists: true, $ne: null };
    }

    const progress = await Progress.find(filter)
      .populate('lesson', 'title duration')
      .populate('quiz', 'title passingScore')
      .sort({ completedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Progress.countDocuments(filter);

    // Get overall statistics
    const stats = await Progress.getUserProgress(userId);
    const overallStats = stats[0] || {
      totalLessons: 0,
      completedLessons: 0,
      totalQuizzes: 0,
      passedQuizzes: 0,
      averageScore: 0
    };

    res.status(200).json({
      success: true,
      data: {
        progress,
        overallStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLessonProgress = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { userId = req.user.id } = req.query;

    const progress = await Progress.findOne({
      user: userId,
      lesson: lessonId
    });

    const lesson = await Lesson.findById(lessonId).select('title duration');

    res.status(200).json({
      success: true,
      data: {
        progress,
        lesson
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizProgress = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { userId = req.user.id } = req.query;

    const attempts = await Progress.find({
      user: userId,
      quiz: quizId
    }).sort({ createdAt: -1 });

    const quiz = await Quiz.findById(quizId).select('title passingScore maxAttempts');

    const analytics = {
      totalAttempts: attempts.length,
      bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0,
      lastAttempt: attempts[0] || null,
      passed: attempts.some(a => a.passed),
      attemptsRemaining: quiz.maxAttempts - attempts.length
    };

    res.status(200).json({
      success: true,
      data: {
        attempts,
        quiz,
        analytics
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProgressOverview = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get progress timeline
    const timeline = await Progress.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          lessonsCompleted: { $sum: { $cond: [{ $ne: ["$lesson", null] }, 1, 0] } },
          quizzesAttempted: { $sum: { $cond: [{ $ne: ["$quiz", null] }, 1, 0] } },
          quizzesPassed: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get topic mastery
    const lessonProgress = await Progress.find({
      user: req.user.id,
      lesson: { $exists: true, $ne: null }
    }).populate('lesson', 'topics');

    const topicMastery = {};
    lessonProgress.forEach(progress => {
      if (progress.lesson && progress.lesson.topics) {
        progress.lesson.topics.forEach(topic => {
          if (!topicMastery[topic]) {
            topicMastery[topic] = { completed: 0, total: 0 };
          }
          topicMastery[topic].total++;
          if (progress.completed) {
            topicMastery[topic].completed++;
          }
        });
      }
    });

    // Convert to percentage
    const topicMasteryPercentage = Object.entries(topicMastery).map(([topic, stats]) => ({
      topic,
      mastery: (stats.completed / stats.total) * 100,
      completed: stats.completed,
      total: stats.total
    }));

    // Get activity heatmap
    const activityHeatmap = await Progress.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$createdAt" },
            hour: { $hour: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeline,
        topicMastery: topicMasteryPercentage,
        activityHeatmap
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const { timeframe = 'month', limit = 20 } = req.query;
    
    let startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const leaderboard = await Progress.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          quiz: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$user",
          totalQuizzes: { $sum: 1 },
          passedQuizzes: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" },
          totalPoints: { $sum: "$score" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.name",
          email: "$userInfo.email",
          avatar: "$userInfo.avatar",
          totalQuizzes: 1,
          passedQuizzes: 1,
          averageScore: { $round: ["$averageScore", 2] },
          totalPoints: { $round: ["$totalPoints", 2] },
          passRate: {
            $cond: [
              { $eq: ["$totalQuizzes", 0] },
              0,
              { $multiply: [{ $divide: ["$passedQuizzes", "$totalQuizzes"] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

export const exportProgress = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    const progress = await Progress.find({ user: req.user.id })
      .populate('lesson', 'title duration')
      .populate('quiz', 'title passingScore')
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user.id).select('name email');

    if (format === 'csv') {
      // Convert to CSV
      const csvData = progress.map(p => ({
        Date: p.createdAt.toISOString().split('T')[0],
        Type: p.lesson ? 'Lesson' : 'Quiz',
        Title: p.lesson?.title || p.quiz?.title || 'Unknown',
        Score: p.score || 'N/A',
        Status: p.completed ? 'Completed' : p.passed ? 'Passed' : 'In Progress'
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      res.status(200)
        .setHeader('Content-Type', 'text/csv')
        .setHeader('Content-Disposition', `attachment; filename="progress-${Date.now()}.csv"`)
        .send(csv);
    } else {
      res.status(200).json({
        success: true,
        data: {
          user,
          progress,
          exportDate: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    next(error);
  }
};