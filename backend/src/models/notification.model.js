import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['lesson', 'quiz', 'progress', 'system', 'achievement', 'reminder'],
    default: 'system'
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['lesson', 'quiz', 'user', 'system']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityType'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, data) {
  const notification = await this.create({
    user: userId,
    ...data
  });
  return notification;
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

export default mongoose.model('Notification', notificationSchema);