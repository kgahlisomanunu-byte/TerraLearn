import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    required: true
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if user has role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

export default mongoose.model('User', userSchema);