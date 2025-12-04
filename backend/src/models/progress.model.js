import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedAnswer: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
});

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  answers: [answerSchema],
  completed: {
    type: Boolean,
    default: false
  },
  passed: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Compound indexes for better query performance
progressSchema.index({ user: 1, lesson: 1 });
progressSchema.index({ user: 1, quiz: 1 });
progressSchema.index({ user: 1, completed: 1 });
progressSchema.index({ user: 1, createdAt: -1 });

// Virtual for percentage score
progressSchema.virtual('percentage').get(function() {
  if (this.totalQuestions === 0) return 0;
  return (this.correctAnswers / this.totalQuestions) * 100;
});

// Pre-save middleware to set passed status and completedAt
progressSchema.pre('save', function(next) {
  if (this.quiz && this.score >= 70) { // Assuming 70% is passing
    this.passed = true;
  }
  
  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Static method to get user's overall progress
progressSchema.statics.getUserProgress = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalLessons: { $sum: { $cond: [{ $ne: ['$lesson', null] }, 1, 0] } },
        completedLessons: { $sum: { $cond: ['$completed', 1, 0] } },
        totalQuizzes: { $sum: { $cond: [{ $ne: ['$quiz', null] }, 1, 0] } },
        passedQuizzes: { $sum: { $cond: ['$passed', 1, 0] } },
        averageScore: { $avg: '$score' }
      }
    }
  ]);
};

export default mongoose.model('Progress', progressSchema);

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country'
  },
  activityType: {
    type: String,
    enum: ['lesson_started', 'lesson_completed', 'quiz_attempted', 'quiz_completed', 'country_studied', 'course_enrolled', 'achievement_earned'],
    required: true
  },
  data: {
    score: Number,
    timeSpent: Number, // in seconds
    attempts: Number,
    correctAnswers: Number,
    totalQuestions: Number,
    progressPercentage: Number,
    xpEarned: Number
  },
  metadata: {
    device: String,
    browser: String,
    ipAddress: String,
    location: mongoose.Schema.Types.Mixed
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
userProgressSchema.index({ user: 1, createdAt: -1 });
userProgressSchema.index({ user: 1, activityType: 1 });
userProgressSchema.index({ user: 1, course: 1, createdAt: -1 });