// Minimal in-memory fixed-window rate limiter (no extra dependency needed).
// Fine for a single-process demo/coursework deployment; swap for a Redis-backed limiter behind a load balancer.
function rateLimit({ windowMs = 60000, max = 30 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of hits) {
      const kept = timestamps.filter(t => t > cutoff);
      kept.length ? hits.set(key, kept) : hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const timestamps = (hits.get(key) || []).filter(t => t > now - windowMs);
    if (timestamps.length >= max) return res.status(429).json({ success: false, message: 'Too many requests. Please slow down and try again shortly.' });
    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}
module.exports = rateLimit;
