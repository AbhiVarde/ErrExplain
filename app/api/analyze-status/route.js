import { Client, Databases, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { getClientId } from "../utils";

export async function GET(request) {
  try {
    const clientId = getClientId(request);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const databases = new Databases(client);

      const submissions = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal("clientId", clientId),
          Query.greaterThanEqual("$createdAt", today.toISOString()),
          Query.lessThan("$createdAt", tomorrow.toISOString()),
        ]
      );

      const count = submissions.total;
      const remaining = Math.max(0, 5 - count);

      return NextResponse.json({
        remaining,
        maxRequests: 5,
        resetTime: tomorrow,
        canAnalyze: remaining > 0,
      });
    } catch (error) {
      console.error("Rate limit check failed:", error);
      return NextResponse.json({
        remaining: 5,
        maxRequests: 5,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        canAnalyze: true,
      });
    }
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({
      remaining: 5,
      maxRequests: 5,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      canAnalyze: true,
    });
  }
}
