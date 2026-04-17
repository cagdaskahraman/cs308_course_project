const KEY = 'electrostore_wishlist';

export function readWishlist(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function writeWishlist(ids: Set<string>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore */
  }
}

export function toggleWishlistId(ids: Set<string>, id: string): Set<string> {
  const next = new Set(ids);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  writeWishlist(next);
  return next;
}
