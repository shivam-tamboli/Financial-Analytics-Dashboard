// Same deterministic scheme the backend's seed script uses for transaction
// avatars (backend/src/scripts/seed.ts) — same seed in, same portrait out,
// so a given user's face never changes between logins or re-renders.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getAvatarUrl(seed: string): string {
  const hash = hashString(seed);
  const index = (hash % 99) + 1;
  const gender = hash % 2 === 0 ? 'women' : 'men';
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}
