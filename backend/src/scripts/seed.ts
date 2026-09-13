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

// Small deterministic string hash — same name always produces the same number,
// so a given user's avatar doesn't change between requests or re-seeds.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// randomuser.me's portrait sets only go up to index 99, split by gender. We don't
// have a real gender for these sample users, so it's derived from the same hash
// as the portrait index — arbitrary, but stable per user, which is all that matters.
function avatarFor(userId: string): string {
  const hash = hashString(nameFor(userId));
  const index = (hash % 99) + 1;
  const gender = hash % 2 === 0 ? 'women' : 'men';
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}

async function seed(): Promise<void> {
  await connectDB();

  const dataPath = path.resolve(__dirname, '../../data/transactions.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const transactions: RawTransaction[] = JSON.parse(raw);

  // Drops any index no longer declared on the schema (e.g. the old unique index on
  // the removed numeric `id` field) before inserting — otherwise a stale unique
  // index rejects every doc after the first, since they'd all have `id: undefined`.
  await Transaction.syncIndexes();

  await Transaction.deleteMany({});
  const docs = transactions.map((t) => ({
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
  await Promise.all([Transaction.syncIndexes(), User.syncIndexes()]);
  console.log('[seed] indexes verified');

  await disconnectDB();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
