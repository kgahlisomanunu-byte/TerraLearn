import Quiz from '../models/Quiz.model.js';
import Progress from '../models/Progress.model.js';

export class QuizService {
  // Create new quiz
  static async createQuiz(quizData, createdBy) {
    const quiz = await Quiz.create({
      ...quizData,
      createdBy
    });

    return quiz;
  }

  // Get all quizzes with filtering
  static async getQuizzes(query = {}, user = null) {
    const { 
      page = 1, 
      limit = 10, 
      lesson, 
      isActive = true,
      search 
    } = query;

    const skip = (page - 1) * limit;

    const filter = {};

    if (lesson) {
      filter.lesson = lesson;
    }

    if (isActive !== 'false') {
      filter.isActive = true;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const quizzes = await Quiz.find(filter)
      .populate('lesson', 'title description')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Quiz.countDocuments(filter);

    return {
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get quiz by ID
  static async getQuizById(quizId, user = null) {
    const quiz = await Quiz.findById(quizId)
      .populate('lesson', 'title description content')
      .populate('createdBy', 'name');

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (!quiz.isActive && (!user || user.role === 'learner')) {
      throw new Error('Quiz not available');
    }

    // For learners, don't send correct answers in questions
    if (user && user.role === 'learner') {
      const quizObj = quiz.toObject();
      quizObj.questions = quizObj.questions.map(q => {
        const { correctAnswer, ...questionWithoutAnswer } = q;
        return questionWithoutAnswer;
      });
      return quizObj;
    }

    return quiz;
  }

  // Submit quiz attempt
  static async submitQuiz(quizId, answers, timeSpent, userId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isActive) {
      throw new Error('Quiz not found or not active');
    }

    // Check if user has attempts left
    const previousAttempts = await Progress.countDocuments({
      user: userId,
      quiz: quizId
    });

    if (previousAttempts >= quiz.maxAttempts) {
      throw new Error('Maximum attempts reached for this quiz');
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[answer.questionIndex];
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      
      if (isCorrect) {
        correctAnswers += question.points;
      }

      return {
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const score = totalPoints > 0 ? (correctAnswers / totalPoints) * 100 : 0;
    const passed = score >= quiz.passingScore;

    // Create progress record
    const progress = await Progress.create({
      user: userId,
      quiz: quizId,
      attemptNumber: previousAttempts + 1,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      timeSpent,
      answers: detailedAnswers,
      completed: true,
      passed,
      completedAt: new Date()
    });

    // Create notification based on result
    const notificationTitle = passed ? 'Quiz Passed! 🎉' : 'Quiz Attempt Completed';
    const notificationMessage = passed 
      ? `Congratulations! You passed the quiz "${quiz.title}" with a score of ${score.toFixed(1)}%`
      : `You completed the quiz "${quiz.title}" with a score of ${score.toFixed(1)}%. Keep practicing!`;

    await Notification.createNotification(userId, {
      title: notificationTitle,
      message: notificationMessage,
      type: 'quiz',
      relatedEntity: {
        entityType: 'quiz',
        entityId: quizId
      },
      actionUrl: `/quizzes/${quizId}`
    });

    return {
      progress,
      quizTitle: quiz.title,
      score: score.toFixed(1),
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      attemptNumber: previousAttempts + 1,
      maxAttempts: quiz.maxAttempts
    };
  }

  // Get quiz results and analytics
  static async getQuizResults(quizId, userId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const attempts = await Progress.find({
      user: userId,
      quiz: quizId
    }).sort({ createdAt: -1 });

    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(a => a.score))
      : 0;

    const analytics = {
      totalAttempts: attempts.length,
      bestScore,
      lastAttempt: attempts[0] || null,
      passed: attempts.some(a => a.passed),
      attemptsRemaining: quiz.maxAttempts - attempts.length
    };

    return {
      quiz: {
        title: quiz.title,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts
      },
      attempts,
      analytics
    };
  }
}