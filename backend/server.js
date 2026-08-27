import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const keyTail = (value) => {
  const key = String(value || '').trim();
  if (!key) return '(not set)';
  return key.length <= 4 ? key : `…${key.slice(-4)}`;
};

console.log(
  '[resume AI keys]',
  `GROQ_API_KEY=${keyTail(process.env.GROQ_API_KEY)}`,
  `| GROQ_API_KEY_FALLBACK=${keyTail(process.env.GROQ_API_KEY_FALLBACK)}`,
  `| GEMINI_API_KEY=${keyTail(process.env.GEMINI_API_KEY)}`
);

console.log(
  '[resume AI]',
  process.env.GROQ_API_KEY?.trim() || process.env.GROQ_API_KEY_FALLBACK?.trim()
    ? process.env.GROQ_API_KEY_FALLBACK?.trim()
      ? 'Groq configured (primary + fallback key)'
      : 'Groq configured'
    : 'Groq not set',
  '|',
  process.env.GEMINI_API_KEY?.trim() ? 'Gemini configured' : 'Gemini not set',
  '|',
  process.env.ANTHROPIC_API_KEY?.trim()
    ? 'Claude configured'
    : 'Claude not set'
);

console.log(
  '[vapi]',
  process.env.VAPI_PRIVATE_KEY?.trim() || process.env.VAPI_API_KEY?.trim()
    ? 'Private key configured (server-side assistants)'
    : 'VAPI_PRIVATE_KEY missing — live interviews will fail until set in backend/.env'
);

const connectDB = (await import('./src/config/db.js')).default;
await connectDB();

const { default: app } = await import('./src/app.js');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[server] Port ${PORT} is already in use. Stop the other backend (duplicate npm run dev) or set PORT in .env.`
    );
    process.exit(1);
  }

  throw error;
});
