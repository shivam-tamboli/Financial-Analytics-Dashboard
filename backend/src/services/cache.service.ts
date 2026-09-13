// Simple in-memory TTL cache for the summary endpoint's aggregate rollup
// (categoryBreakdown + yearly). There's no Redis in this stack, and the app has
// exactly one process, so a Map is enough — no need to reach for a dependency.
//
// There's currently no write endpoint for transactions (the API is read + CSV
// export only; the only way data changes is the seed script, which runs outside
// this process). So there's nothing to wire real invalidation to yet — `clearAll`
// is exported and ready for a future write path to call, and in the meantime the
// short TTL below is what keeps this from ever serving genuinely stale data for
// long. recentTransactions is deliberately never cached (see the controller) — it
// stays live on every request.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 60_000;

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearAll(): void {
  store.clear();
}
