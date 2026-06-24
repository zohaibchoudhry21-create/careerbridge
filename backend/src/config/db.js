import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not defined in environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    console.warn('Server will continue without database. Start MongoDB for full MERN functionality.');
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
