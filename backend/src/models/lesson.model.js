import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'interactive', 'audio'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String
});

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Lesson description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  gradeLevel: {
    type: String,
    required: true,
    default: 'Grade 12'
  },
  subject: {
    type: String,
    default: 'Geography'
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 minute']
  },
  resources: [resourceSchema],
  topics: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  learningObjectives: [String],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thumbnail: String
}, {
  timestamps: true
});

// Text search index
lessonSchema.index({ 
  title: 'text', 
  description: 'text', 
  content: 'text',
  topics: 'text'
});

// Compound indexes for better query performance
lessonSchema.index({ gradeLevel: 1, isPublished: 1 });
lessonSchema.index({ createdBy: 1, createdAt: -1 });

// Static method to find published lessons
lessonSchema.statics.findPublished = function() {
  return this.find({ isPublished: true });
};

// Instance method to check if lesson is accessible
lessonSchema.methods.isAccessible = function() {
  return this.isPublished;
};

export default mongoose.model('Lesson', lessonSchema);

({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  contentType: {
    type: String,
    enum: ['video', 'text', 'interactive', 'quiz', 'game', 'mixed'],
    default: 'mixed'
  },
  content: {
    video: {
      url: String,
      duration: Number,
      transcript: String,
      subtitles: [{
        language: String,
        url: String
      }]
    },
    text: {
      html: String,
      markdown: String
    },
    images: [{
      url: String,
      caption: String,
      alt: String
    }],
    audio: [{
      url: String,
      duration: Number,
      title: String
    }],
    interactive: {
      type: {
        type: String,
        enum: ['map', 'timeline', 'drag-drop', 'matching', 'puzzle']
      },
      data: mongoose.Schema.Types.Mixed
    }
  },
  learningPoints: [{
    point: String,
    importance: {
      type: String,
      enum: ['key', 'important', 'nice-to-know']
    }
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedDuration: Number, // in minutes
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    completionRate: Number,
    averageTimeSpent: Number,
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  isFree: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for course lessons ordering
lessonSchema.index({ course: 1, order: 1 });