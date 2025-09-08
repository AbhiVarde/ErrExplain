import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { Client, Databases, ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { getClientId, isValidError } from "../utils";

const errorAnalysisSchema = z.object({
  explanation: z.string(),
  causes: z.array(z.string()),
  solutions: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
  category: z.string(),
  exampleCode: z.string(),
});

// Auto-moderation function to strip sensitive data
function moderateErrorMessage(errorMessage) {
  let moderated = errorMessage;

  const sensitivePatterns = [
    /[a-zA-Z0-9]{20,}/g, // Long alphanumeric strings (potential tokens)
    /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
    /pk_[a-zA-Z0-9_]{50,}/g, // Stripe keys
    /AKIA[0-9A-Z]{16}/g, // AWS access keys
    /password[=:]\s*[^\s\n]+/gi, // Password fields
    /token[=:]\s*[^\s\n]+/gi, // Token fields
    /key[=:]\s*[^\s\n]+/gi, // Key fields
    /secret[=:]\s*[^\s\n]+/gi, // Secret fields
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IP addresses
    /\/home\/[a-zA-Z0-9_-]+/g, // Unix home paths
    /C:\\Users\\[a-zA-Z0-9_-]+/g, // Windows user paths
  ];

  sensitivePatterns.forEach((pattern) => {
    moderated = moderated.replace(pattern, "[REDACTED]");
  });

  return moderated;
}

async function checkRateLimit(clientId) {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Count submissions from this client today
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

    return {
      allowed: remaining > 0,
      remaining: remaining,
      resetTime: tomorrow,
      count: count,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: 5,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      count: 0,
    };
  }
}

export async function POST(request) {
  try {
    const { errorMessage, language, isPrivate = false } = await request.json();

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

    const clientId = getClientId(request);

    // Only check rate limit if we're going to save to database (non-private)
    if (!isPrivate) {
      const rateLimit = await checkRateLimit(clientId);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: `Daily limit reached (${rateLimit.count}/5 analyses used today).`,
            remaining: 0,
            resetTime: rateLimit.resetTime,
          },
          { status: 429 }
        );
      }
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Auto-moderate the error message
    const moderatedError = moderateErrorMessage(errorMessage);

    const rawPrompt = process.env.ERROR_ANALYSIS_PROMPT;
    // Use the moderated error in the prompt
    const finalPrompt = rawPrompt
      .replace(/\{\{language\}\}/g, language)
      .replace(/\{\{errorMessage\}\}/g, moderatedError);

    const { object: analysis } = await generateObject({
      model: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
      schema: errorAnalysisSchema,
      prompt: finalPrompt,
    });

    let documentId = null;
    let rateLimitUpdate = null;

    // Only save to database if NOT private
    if (!isPrivate) {
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
            errorMessage: moderatedError.substring(0, 1000),
            language: language.substring(0, 50),
            explanation: analysis.explanation,
            causes: analysis.causes,
            solutions: analysis.solutions,
            exampleCode: analysis.exampleCode,
            clientId: clientId,
            severity: analysis.severity,
            category: analysis.category,
            isPrivate: false, // Only non-private errors are saved
          }
        );

        documentId = document.$id;

        const rateLimit = await checkRateLimit(clientId);
        rateLimitUpdate = {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        };
      } catch (dbError) {
        console.error("Appwrite save failed:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        language,
        id: documentId,
        isShared: false,
        shareId: null,
        isPrivate: isPrivate,
      },
      rateLimit: rateLimitUpdate || {
        remaining: 5,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
