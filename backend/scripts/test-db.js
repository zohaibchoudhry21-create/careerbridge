import dotenv from 'dotenv';
import connectDB, { getDbStatus } from '../src/config/db.js';

dotenv.config();

await connectDB();

const db = getDbStatus();

if (db.connected) {
  console.log('Local MongoDB connection test passed.');
  console.log(`Host: ${db.host}`);
  console.log(`Database: ${db.database}`);
  process.exit(0);
}

console.error('Local MongoDB connection test failed.');
console.error(`Status: ${db.status}`);
process.exit(1);
