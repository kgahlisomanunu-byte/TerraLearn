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