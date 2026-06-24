import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { isProviderConfigured } from '../src/config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const providers = ['google', 'facebook', 'linkedin'];

console.log('\nAI CareerBridge — Social Auth Setup Check\n');
console.log(`API URL:    ${API_URL}`);
console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);

let configuredCount = 0;

providers.forEach((provider) => {
  const configured = isProviderConfigured(provider);
  if (configured) configuredCount += 1;

  console.log(`${configured ? '✓' : '✗'} ${provider.toUpperCase()}`);
  console.log(`  Auth:     ${API_URL}/auth/${provider}`);
  console.log(`  Callback: ${API_URL}/auth/${provider}/callback`);

  if (!configured) {
    const envKeys = {
      google: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
      facebook: 'FACEBOOK_APP_ID, FACEBOOK_APP_SECRET',
      linkedin: 'LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET',
    };
    console.log(`  Missing:  ${envKeys[provider]}`);
  }

  console.log('');
});

if (configuredCount === 0) {
  console.log('No providers configured yet.');
  console.log('Add OAuth keys to backend/.env, then restart: npm run dev\n');
  process.exit(1);
}

console.log(`${configuredCount}/${providers.length} provider(s) ready.\n`);
process.exit(0);
