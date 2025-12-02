import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
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
    console.error(process.env.MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//***:***@'));
    
    throw error;
  }
};

export default connectDB;