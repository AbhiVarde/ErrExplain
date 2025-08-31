import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { Client, Databases, ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { getClientId, isValidError } from "../utils";

// Schema for structured AI output
const errorAnalysisSchema = z.object({
  explanation: z.string(),
  causes: z.array(z.string()),
  solutions: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
  category: z.string(),
});

async function checkAppwriteRateLimit(clientId) {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    const maxRequests = 5;

    try {
      // Try to get existing rate limit document
      const rateLimitDoc = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RATE_LIMITS_COLLECTION_ID,
        clientId
      );

      const requests = rateLimitDoc.requests || [];
      const recentRequests = requests.filter((time) => now - time < windowMs);
      const remaining = Math.max(0, maxRequests - recentRequests.length);

      if (remaining === 0) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(recentRequests[0] + windowMs),
        };
      }

      // Add current request
      recentRequests.push(now);

      // Update the document
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RATE_LIMITS_COLLECTION_ID,
        clientId,
        {
          requests: recentRequests,
          lastReset: now,
        }
      );

      return {
        allowed: true,
        remaining: maxRequests - recentRequests.length,
        resetTime: new Date(recentRequests[0] + windowMs),
      };
    } catch (error) {
      if (error.code === 404) {
        // Document doesn't exist, create it
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_RATE_LIMITS_COLLECTION_ID,
          clientId,
          {
            clientId: clientId,
            requests: [now],
            lastReset: now,
          }
        );

        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetTime: new Date(now + windowMs),
        };
      }
      throw error;
    }
  } catch (error) {
    console.error("Appwrite rate limit check failed:", error);
    // Fall back to memory-based rate limiting
    const { checkRateLimit } = await import("../utils");
    return await checkRateLimit(clientId);
  }
}

export async function POST(request) {
  try {
    const { errorMessage, language } = await request.json();

    // Validate inputs
    if (!errorMessage || !language) {
      return NextResponse.json(
        { error: "Error message and language are required" },
        { status: 400 }
      );
    }

    if (errorMessage.length > 2000) {
      return NextResponse.json(
        { error: "Error message too long (max 2000 chars)" },
        { status: 400 }
      );
    }

    if (!isValidError(errorMessage)) {
      return NextResponse.json(
        {
          error: "This does not look like an error message.",
          suggestion:
            "Error messages usually contain words like 'Error:', 'Exception:', 'TypeError:', or stack traces.",
        },
        { status: 400 }
      );
    }

    // Rate limiting with Appwrite
    const clientId = getClientId(request);
    const rateLimit = await checkAppwriteRateLimit(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Daily limit reached (5 errors/day).",
          remaining: 0,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    // Check GROQ
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Call LLM
    const { object: analysis } = await generateObject({
      model: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
      schema: errorAnalysisSchema,
      prompt: `
        Analyze this ${language} error message and provide a comprehensive breakdown:
        
        Error: "${errorMessage}"
        
        Please provide:
        1. A clear, plain English explanation of what this error means
        2. The most likely causes (2-4 common reasons this happens)
        3. Step-by-step solutions to fix it (be specific and actionable)
        4. Severity level of this error
        5. Error category
        
        Make your response beginner-friendly but technically accurate. Focus on practical, actionable advice.
        Only respond if this is actually an error message, not general text.
      `,
    });

    // Save to Appwrite
    let documentId = null;
    if (
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
      process.env.APPWRITE_API_KEY &&
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID &&
      process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID
    ) {
      try {
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        const document = await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
          ID.unique(),
          {
            errorMessage: errorMessage.substring(0, 1000),
            language: language.substring(0, 50),
            explanation: analysis.explanation,
            causes: analysis.causes,
            solutions: analysis.solutions,
          }
        );

        documentId = document.$id;
        console.log("Successfully saved to Appwrite:", documentId);
      } catch (dbError) {
        console.error("Appwrite save failed:", dbError);
        // Continue without failing the request
      }
    }

    return NextResponse.json({
      success: true,
      analysis: { ...analysis, language, id: documentId },
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      },
    });
  } catch (error) {
    console.error("Analyze API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze error message" },
      { status: 500 }
    );
  }
}
