import type { ProfileSnapshot } from "./profile";
import { normalizeProfile, SourceError } from "./profile-url";
/** Small, per-instance MVP cache. Not a distributed quota or proof of ownership. */
export class PublicProfileReader {
  private cache = new Map<
    string,
    { snapshot: ProfileSnapshot; expires: number }
  >();
  private pending = new Map<string, Promise<ProfileSnapshot>>();
  private callers = new Map<string, { count: number; until: number }>();
  constructor(
    private source: (url: string) => Promise<ProfileSnapshot>,
    private now = () => Date.now(),
  ) {}
  async read(input: string, caller: string, force = false) {
    const url = normalizeProfile(input),
      now = this.now();
    for (const [key, bucket] of this.callers)
      if (bucket.until <= now) this.callers.delete(key);
    const bucket = this.callers.get(caller);
    if (bucket && bucket.count >= 20)
      throw new SourceError(
        "rate_limited",
        "Too many profile checks. Please wait a minute.",
      );
    if (this.callers.size >= 1000 && !bucket)
      this.callers.delete(this.callers.keys().next().value!);
    this.callers.set(caller, {
      count: (bucket?.count ?? 0) + 1,
      until: bucket?.until ?? now + 60_000,
    });
    const cached = this.cache.get(url);
    if (cached && cached.expires > now && !force)
      return { snapshot: cached.snapshot, cached: true };
    const pending = this.pending.get(url);
    if (pending) return { snapshot: await pending, cached: false };
    if (this.pending.size >= 2)
      throw new SourceError(
        "busy",
        "Profile collection is busy. Please try again shortly.",
      );
    const job = this.source(url);
    this.pending.set(url, job);
    try {
      const snapshot = await job;
      if (!this.cache.has(url) && this.cache.size >= 100)
        this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(url, { snapshot, expires: this.now() + 6 * 3600_000 });
      return { snapshot, cached: false };
    } catch (error) {
      this.cache.delete(url);
      throw error;
    } finally {
      this.pending.delete(url);
    }
  }
}
