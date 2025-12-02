import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0,
    validate: {
      validator: function(value) {
        return value < this.options.length;
      },
      message: 'Correct answer index must be within options range'
    }
  },
  explanation: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 1,
    min: [1, 'Points must be at least 1']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'map-based'],
    default: 'multiple-choice'
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number,
    default: 30,
    min: [1, 'Time limit must be at least 1 minute']
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showAnswers: {
    type: Boolean,
    default: true
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
quizSchema.index({ lesson: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isActive: 1 });

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Instance method to check if quiz is available
quizSchema.methods.isAvailable = function() {
  return this.isActive;
};

// Static method to find active quizzes
quizSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

export default mongoose.model('Quiz', quizSchema);