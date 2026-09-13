import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '5050', 10),
  // No fallback: a missing MONGO_URI must crash the app immediately with a clear
  // message, rather than silently defaulting to a localhost that won't exist on
  // a deployed host and failing later with a confusing ECONNREFUSED.
  mongoUri: required('MONGO_URI'),
  // Same reasoning as MONGO_URI above: no fallback. A deployed app running on a
  // guessable default JWT secret can have its tokens forged, so a missing secret
  // should stop the app from starting, not quietly sign tokens with a known value.
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  // Comma-separated list so both the local dev origin and a deployed frontend
  // origin can be allowed at once, e.g. "http://localhost:5173,https://app.example.com".
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  seedAdmin: {
    username: process.env.SEED_ADMIN_USERNAME ?? 'analyst',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Analyst@123',
    name: process.env.SEED_ADMIN_NAME ?? 'Jordan Rivera',
  },
};
