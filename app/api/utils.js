export function getClientId(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "";

  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  const fingerprint = Buffer.from(userAgent + ip)
    .toString("base64")
    .slice(0, 16);

  return fingerprint.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);
}

// flexible error validation 
export function isValidError(text) {
  if (!text || text.trim().length < 8) return false;

  const cleanText = text.trim();
  let score = 0;

  // Strong error indicators
  const patterns = [
    // Common error types
    /\b(error|exception|failed|failure)\s*[:]/i,
    /\b(typeerror|referenceerror|syntaxerror|nameerror|valueerror|keyerror|importerror)\b/i,

    // Stack traces and line numbers
    /at\s+.*:\d+:\d+/i,
    /line\s+\d+/i,
    /:\d+:\d+/,

    // Common error phrases
    /cannot\s+(read|find|resolve|access)/i,
    /is\s+not\s+(defined|found|a\s+function)/i,
    /unexpected\s+(token|end)/i,
    /module\s+not\s+found/i,

    // HTTP errors
    /\b(404|500|502|503)\b/i,

    // File extensions in errors
    /\.(js|py|java|php|cpp)[\s:"]/i,
  ];

  patterns.forEach((pattern) => {
    if (pattern.test(cleanText)) score++;
  });

  return score >= 1; 
}

// Language-specific sample errors
export function getSampleErrors(language) {
  const samples = {
    JavaScript: [
      "TypeError: Cannot read property 'length' of undefined",
      "ReferenceError: $ is not defined",
      "SyntaxError: Unexpected token }",
    ],
    Python: [
      "NameError: name 'pandas' is not defined",
      "KeyError: 'missing_key'",
      "IndentationError: expected an indented block",
    ],
    Java: [
      "java.lang.NullPointerException at Main.java:15",
      "java.lang.ClassNotFoundException: com.example.Test",
      "java.lang.ArrayIndexOutOfBoundsException",
    ],
    React: [
      "Warning: Each child in a list should have a unique key prop",
      "Error: Hooks can only be called inside function components",
      "Cannot update a component while rendering",
    ],
    "Node.js": [
      "Error: Cannot find module 'express'",
      "ENOENT: no such file or directory",
      "TypeError: app.listen is not a function",
    ],
    TypeScript: [
      "Property 'name' does not exist on type '{}'",
      "Type 'string' is not assignable to type 'number'",
      "TS2339: Property 'id' does not exist",
    ],
    Default: [
      "TypeError: Cannot read property 'map' of undefined",
      "SyntaxError: Unexpected token }",
      "ReferenceError: variable is not defined",
    ],
  };

  return samples[language] || samples["Default"];
}

// Simple language detection from error
export function detectLanguage(errorText) {
  const indicators = {
    Python: [/\.py[\s:"]/i, /traceback/i, /nameerror|keyerror|valueerror/i],
    Java: [/\.java:\d+/i, /exception in thread/i, /nullpointerexception/i],
    JavaScript: [
      /\.js:\d+/i,
      /typeerror.*cannot read/i,
      /referenceerror.*not defined/i,
    ],
    TypeScript: [/\.ts:\d+/i, /property.*does not exist/i, /ts\d{4}/i],
    PHP: [/\.php/i, /fatal error/i, /parse error/i],
    React: [
      /warning.*key prop/i,
      /hooks can only/i,
      /cannot update.*component/i,
    ],
  };

  for (const [lang, patterns] of Object.entries(indicators)) {
    if (patterns.some((pattern) => pattern.test(errorText))) {
      return lang;
    }
  }
  return null;
}
