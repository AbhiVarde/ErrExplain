export function getClientId(request) {
  // Simple browser fingerprint using IP + User Agent
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "";

  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  const fingerprint = Buffer.from(userAgent + ip)
    .toString("base64")
    .slice(0, 16);

  return fingerprint.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);
}

export function isValidError(text) {
  if (!text || text.trim().length < 10) return false;
  const pattern =
    /(error|exception|typeerror|referenceerror|stack|trace|at\s+.+:\d+)/i;
  return pattern.test(text);
}
