import { Client, Databases } from "node-appwrite";
import { NextResponse } from "next/server";
import { getClientId } from "../utils";

export async function GET(request) {
  try {
    const clientId = getClientId(request);
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    const maxRequests = 5;

    // Check if all required Appwrite environment variables are present
    if (
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
      process.env.APPWRITE_API_KEY &&
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID &&
      process.env.NEXT_PUBLIC_APPWRITE_RATE_LIMITS_COLLECTION_ID
    ) {
      try {
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        try {
          // Try to get existing rate limit document
          const rateLimitDoc = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_RATE_LIMITS_COLLECTION_ID,
            clientId
          );

          const requests = rateLimitDoc.requests || [];
          const recentRequests = requests.filter(
            (time) => now - time < windowMs
          );
          const remaining = Math.max(0, maxRequests - recentRequests.length);

          return NextResponse.json({
            remaining,
            maxRequests,
            resetTime:
              recentRequests.length > 0
                ? new Date(recentRequests[0] + windowMs)
                : new Date(now + windowMs),
            canAnalyze: remaining > 0,
          });
        } catch (error) {
          if (error.code === 404) {
            // Document doesn't exist, user has full quota
            return NextResponse.json({
              remaining: maxRequests,
              maxRequests,
              resetTime: new Date(now + windowMs),
              canAnalyze: true,
            });
          }
          throw error;
        }
      } catch (error) {
        console.error("Appwrite rate limit check failed:", error);
        // Fall back to memory-based rate limiting
        const { checkRateLimit } = await import("../utils");
        const fallbackLimit = await checkRateLimit(clientId);

        return NextResponse.json({
          remaining: fallbackLimit.remaining,
          maxRequests,
          resetTime: fallbackLimit.resetTime,
          canAnalyze: fallbackLimit.allowed,
        });
      }
    }

    // If Appwrite not configured, fall back to memory
    console.log(
      "Appwrite not properly configured, using memory-based rate limiting"
    );
    const { checkRateLimit } = await import("../utils");
    const fallbackLimit = await checkRateLimit(clientId);

    return NextResponse.json({
      remaining: fallbackLimit.remaining,
      maxRequests: 5,
      resetTime: fallbackLimit.resetTime,
      canAnalyze: fallbackLimit.allowed,
    });
  } catch (error) {
    console.error("Rate limit check error:", error);
    return NextResponse.json(
      {
        remaining: 5,
        maxRequests: 5,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        canAnalyze: true,
      },
      { status: 500 }
    );
  }
}
