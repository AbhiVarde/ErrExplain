// Simple in-memory store for fallback rate limiting
const rateLimitStore = new Map();

export function getClientId(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "";
  const baseId = forwarded || realIp || "unknown";
  const fingerprint = Buffer.from(userAgent).toString("base64").slice(0, 8);

  const rawId = `${baseId}_${fingerprint}`;
  const cleanId = rawId.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 36);

  return cleanId.startsWith("_") ? `u${cleanId.substring(1)}` : cleanId;
}

export async function checkRateLimit(clientId) {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24h
  const maxRequests = 5;

  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, []);
  }

  const requests = rateLimitStore.get(clientId);
  const recentRequests = requests.filter((time) => now - time < windowMs);
  rateLimitStore.set(clientId, recentRequests);

  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(recentRequests[0] + windowMs),
    };
  }

  recentRequests.push(now);
  rateLimitStore.set(clientId, recentRequests);

  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length,
    resetTime: new Date(recentRequests[0] + windowMs),
  };
}

export function isValidError(text) {
  if (!text || text.trim().length < 10) return false;

  // Regex to catch real error-like messages
  const pattern =
    /(error|exception|typeerror|referenceerror|stack|trace|at\s+.+:\d+)/i;

  return pattern.test(text);
}
