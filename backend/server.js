import app from './app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const BASE_PORT = parseInt(process.env.PORT) || 5000;

// Helper: find available port via fallback strategy
function findAvailablePort(startPort, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryPort = (port) => {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`));
        return;
      }
      const testServer = app.listen(port, () => {
        testServer.close();
        resolve(port);
      });
      testServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
    };
    tryPort(startPort);
  });
}

const startServer = async () => {
  try {
    console.log('🚀 Starting TerraLearn Backend...');
    console.log(`⚙️  Environment: ${process.env.NODE_ENV}`);
    
    // Try to connect to MongoDB
    await connectDB();
    
    // Find available port
    const PORT = await findAvailablePort(BASE_PORT);
    const server = app.listen(PORT, () => {
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

    server.on('error', (err) => {
      console.error('Server encountered an error:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    console.error('\n💡 Running in limited mode without database...');
    
    // Start server anyway (for development)
    try {
      const PORT = await findAvailablePort(BASE_PORT);
      const server = app.listen(PORT, () => {
        console.log(`⚠️  Server running in LIMITED mode on port ${PORT}`);
        console.log('   Some features requiring database will not work');
        console.log(`🌐 Open: http://localhost:${PORT}/api`);
      });

      server.on('error', (err) => {
        console.error('Server encountered an error in limited mode:', err);
        process.exit(1);
      });
    } catch (portErr) {
      console.error('Failed to find available port:', portErr.message);
      process.exit(1);
    }
  }
};

startServer();