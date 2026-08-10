import mongoose from 'mongoose';

const connectOptions = {
  serverSelectionTimeoutMS: 8000,
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not defined in backend/.env');
    console.error('Example: MONGO_URI=mongodb://127.0.0.1:27017/ai-careerbridge');
    process.exit(1);
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const conn = await mongoose.connect(uri, connectOptions);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('');
    console.error('[mongodb] Start MongoDB locally, then retry:');
    console.error('  - Windows Service: Start "MongoDB" from Services');
    console.error('  - Or run: mongod --dbpath <your-data-path>');
    console.error(`  - Expected URI: ${uri}`);
    console.error('');
    process.exit(1);
  }
};

export const getDbStatus = () => {
  const state = mongoose.connection.readyState;

  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    connected: state === 1,
    status: states[state] || 'unknown',
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
  };
};

export default connectDB;
