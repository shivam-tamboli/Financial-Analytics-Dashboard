import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

interface RawTransaction {
  id: number;
  date: string;
  amount: number;
  category: 'Revenue' | 'Expense';
  status: 'Paid' | 'Pending';
  user_id: string;
  user_profile: string;
}

// The sample data only ships a user_id; map it to a display name and a stable
// avatar (the provided user_profile URL returns a different random face on
// every request, which is unusable as a UI avatar).
const USER_DIRECTORY: Record<string, string> = {
  user_001: 'Matheus Ferrero',
  user_002: 'Floyd Miles',
  user_003: 'Jerome Bell',
  user_004: 'Elena Novak',
};

function nameFor(userId: string): string {
  return USER_DIRECTORY[userId] ?? userId;
}

// Sample data has no real email, so derive a stable placeholder one from the
// display name purely to key the Gravatar hash.
function emailFor(userId: string): string {
  const local = nameFor(userId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${local}@example.com`;
}

// Gravatar, keyed by an MD5 hash of the (trimmed, lowercased) email. `d=404`
// makes Gravatar respond with an actual 404 instead of a generic silhouette
// when no image is registered for that hash, so the <img> element's onerror
// fires and the frontend's Avatar component falls back to name-based initials
// instead of layering one placeholder image on top of another.
function avatarFor(userId: string): string {
  const hash = crypto.createHash('md5').update(emailFor(userId)).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;
}

async function seed(): Promise<void> {
  await connectDB();

  const dataPath = path.resolve(__dirname, '../../data/transactions.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const transactions: RawTransaction[] = JSON.parse(raw);

  await Transaction.deleteMany({});
  const docs = transactions.map((t) => ({
    id: t.id,
    date: new Date(t.date),
    amount: t.amount,
    category: t.category,
    status: t.status,
    user_id: t.user_id,
    user_name: nameFor(t.user_id),
    user_profile: avatarFor(t.user_id),
  }));
  await Transaction.insertMany(docs);
  console.log(`[seed] inserted ${docs.length} transactions`);

  const existingAdmin = await User.findOne({ username: env.seedAdmin.username.toLowerCase() });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.seedAdmin.password, 10);
    await User.create({
      username: env.seedAdmin.username.toLowerCase(),
      passwordHash,
      name: env.seedAdmin.name,
    });
    console.log(`[seed] created login user "${env.seedAdmin.username}"`);
  } else {
    console.log(`[seed] login user "${env.seedAdmin.username}" already exists, skipping`);
  }

  // Mongoose builds declared indexes in the background on model registration —
  // it does not wait for them before insertMany()/create() resolve. A short-lived
  // script like this one can disconnect while that build is still in flight,
  // silently dropping whichever index hadn't finished yet. Waiting for both
  // explicitly guarantees every index in the schema actually exists before exit.
  await Promise.all([Transaction.createIndexes(), User.createIndexes()]);
  console.log('[seed] indexes verified');

  await disconnectDB();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
