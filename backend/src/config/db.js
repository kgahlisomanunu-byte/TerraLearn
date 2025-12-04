import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Support multiple env var names for the Mongo connection string
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI || process.env.MONGO_URL;
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for Atlas
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected');
    });

    return conn;
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error(`Error: ${error.message}`);
    console.error('\n🔧 Troubleshooting MongoDB Atlas:');
    console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('2. Go to: https://cloud.mongodb.com/');
    console.error('3. Click on "Network Access"');
    console.error('4. Add your current IP address (or 0.0.0.0/0 for all IPs)');
    console.error('5. Wait a few minutes for changes to apply');
    console.error('\n📞 Connection string used:');
    if (process.env.MONGODB_URI) {
      try {
            // Print the value used (redact credentials if possible)
            try {
              const used = mongoUri || process.env.MONGODB_URI || process.env.MONGODB_URL || '(none)';
              if (used && typeof used === 'string') {
                console.error(used.replace(/\/\/(.*):(.*)@/, '//***:***@'));
              } else {
                console.error('(none) MONGODB URI/URL is not set in environment');
              }
            } catch (e) {
              console.error('(unable to redact) ' + (mongoUri || process.env.MONGODB_URI || process.env.MONGODB_URL));
            }
      } catch (e) {
        console.error('(unable to redact) ' + process.env.MONGODB_URI);
      }
    } else {
      console.error('(none) MONGODB_URI is not set in environment');
    }
    
    throw error;
  }
};

export default connectDB;
