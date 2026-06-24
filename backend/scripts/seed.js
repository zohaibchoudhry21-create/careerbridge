import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

dotenv.config();

await connectDB();

await User.deleteMany({ email: 'demo@aicareerbridge.com' });

await User.create({
  name: 'Demo User',
  email: 'demo@aicareerbridge.com',
  password: 'Demo@123456',
  provider: 'local',
  role: 'user',
  status: 'active',
  isVerified: true,
});

console.log('Seed completed.');
console.log('Login with: demo@aicareerbridge.com / Demo@123456');

process.exit(0);
