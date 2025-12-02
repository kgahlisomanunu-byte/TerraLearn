import User from '../models/user.model.js';
import Progress from '../models/progress.model.js';
import Notification from '../models/notification.model.js';
export class UserService {
  // Get user profile with progress
  static async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    const progressStats = await Progress.getUserProgress(userId);
    const stats = progressStats[0] || {
      totalLessons: 0,
      completedLessons: 0,
      totalQuizzes: 0,
      passedQuizzes: 0,
      averageScore: 0
    };

    return {
      user,
      stats
    };
  }

  // Update user profile
  static async updateUserProfile(userId, updateData) {
    const allowedUpdates = ['name', 'bio', 'gradeLevel', 'avatar'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Get all users (admin only)
  static async getAllUsers(query = {}) {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update user role (admin only)
  static async updateUserRole(userId, role) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    // Create notification for role change
    await Notification.createNotification(userId, {
      title: 'Role Updated',
      message: `Your role has been updated to ${role}`,
      type: 'system',
      priority: 'medium'
    });

    return user;
  }

  // Delete user (admin only)
  static async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Also delete user's progress and notifications
    await Progress.deleteMany({ user: userId });
    await Notification.deleteMany({ user: userId });

    return user;
  }

  // Get user dashboard data
  static async getUserDashboard(userId) {
    const user = await User.findById(userId).select('-password');
    const progressStats = await Progress.getUserProgress(userId);
    const stats = progressStats[0] || {
      totalLessons: 0,
      completedLessons: 0,
      totalQuizzes: 0,
      passedQuizzes: 0,
      averageScore: 0
    };

    // Get recent progress
    const recentProgress = await Progress.find({ user: userId })
      .populate('lesson', 'title')
      .populate('quiz', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    return {
      user,
      stats,
      recentProgress,
      unreadNotifications
    };
  }
}