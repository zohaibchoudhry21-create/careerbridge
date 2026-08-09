/**
 * Small in-process TTL LRU for interview read-through caches (role suggestions, etc.).
 * Not a substitute for Redis — safe for single-instance and multi-instance (best-effort).
 */

/**
 * @param {{ maxEntries?: number, ttlMs?: number }} [options]
 */
export function createInterviewTtlCache({ maxEntries = 128, ttlMs = 60_000 } = {}) {
  const map = new Map();

  const evictExpired = (key, entry) => {
    if (!entry) return true;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return true;
    }
    return false;
  };

  return {
    get(key) {
      const entry = map.get(key);
      if (evictExpired(key, entry)) return undefined;
      map.delete(key);
      map.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      if (map.has(key)) map.delete(key);
      while (map.size >= maxEntries) {
        const oldest = map.keys().next().value;
        map.delete(oldest);
      }
      map.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    clear() {
      map.clear();
    },
  };
}
