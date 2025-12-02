import app from './app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🚀 Starting TerraLearn Backend...');
    console.log(`⚙️  Environment: ${process.env.NODE_ENV}`);
    
    // Try to connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log('📚 Available endpoints:');
      console.log(`   - http://localhost:${PORT}/api/auth`);
      console.log(`   - http://localhost:${PORT}/api/users`);
      console.log(`   - http://localhost:${PORT}/api/lessons`);
      console.log(`   - http://localhost:${PORT}/api/quizzes`);
      console.log(`   - http://localhost:${PORT}/api/geo`);
      console.log(`   - http://localhost:${PORT}/api/progress`);
    });
    
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    console.error('\n💡 Running in limited mode without database...');
    
    // Start server anyway (for development)
    app.listen(PORT, () => {
      console.log(`⚠️  Server running in LIMITED mode on port ${PORT}`);
      console.log('   Some features requiring database will not work');
      console.log(`🌐 Open: http://localhost:${PORT}/api`);
    });
  }
};

startServer();