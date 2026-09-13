import mongoose from 'mongoose';
import { env } from './env';

// Never log a Mongo URI as-is: a srv:// connection string embeds the password
// in plain text (user:pass@host), and that string ends up in terminal
// scrollback, redirected log files, and process managers by default.
function redactMongoUri(uri: string): string {
  return uri.replace(/\/\/[^@/]+@/, '//<redacted>@');
}

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  // Mongoose's default serverSelectionTimeoutMS is 30s, which makes a missing or
  // unreachable database look like a hang rather than a clear startup failure.
  // 5s is enough for a real (if slow) network hop but fails fast when there's
  // simply nothing listening.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  // eslint-disable-next-line no-console
  console.log(`[db] connected to ${redactMongoUri(env.mongoUri)}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
