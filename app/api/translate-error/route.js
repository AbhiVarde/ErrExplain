import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { Client, Databases, ID } from "node-appwrite";
import { NextResponse } from "next/server";

// Response schema for structured AI output
const errorAnalysisSchema = z.object({
  explanation: z
    .string()
    .describe("Plain English explanation of what the error means"),
  causes: z.array(z.string()).describe("Array of likely causes for this error"),
  solutions: z
    .array(z.string())
    .describe("Array of step-by-step solutions to fix the error"),
  severity: z
    .enum(["low", "medium", "high"])
    .describe("How critical this error is"),
  category: z
    .string()
    .describe("Category of error (e.g., Syntax, Runtime, Network, etc.)"),
});

// Error validation patterns
const errorPatterns = [
  // JavaScript/TypeScript errors
  /TypeError:|ReferenceError:|SyntaxError:|RangeError:/i,
  /Cannot read property|Cannot read properties/i,
  /is not defined|is not a function/i,
  /Unexpected token|Unexpected end of input/i,
  /Assignment to constant variable/i,

  // Python errors
  /NameError:|TypeError:|ValueError:|KeyError:|IndexError:/i,
  /AttributeError:|ImportError:|IndentationError:/i,
  /SyntaxError:|FileNotFoundError:|PermissionError:/i,

  // Java errors
  /Exception in thread|NullPointerException/i,
  /ClassNotFoundException|NoSuchMethodError/i,
  /OutOfMemoryError|StackOverflowError/i,

  // C++/C errors
  /error:|fatal error:|undefined reference/i,
  /segmentation fault|access violation/i,

  // Web/Network errors
  /404|500|502|503|CORS error/i,
  /Network Error|Connection refused|Timeout/i,

  // Database errors
  /SQL Error|Connection timeout|Access denied/i,
  /Table doesn't exist|Column not found/i,

  // Generic error indicators
  /error:|Error:|ERROR:/,
  /failed:|Failed:|FAILED:/,
  /exception:|Exception:|EXCEPTION:/,
  /warning:|Warning:|WARNING:/,
  /at line \d+|line \d+:/i,
  /stack trace|stacktrace/i,
];

// Rate limiting storage (in-memory for simplicity)
const rateLimitStore = new Map();

function isValidError(text) {
  if (!text || text.trim().length < 10) return false;

  // Check if text contains error patterns
  return errorPatterns.some((pattern) => pattern.test(text));
}

function getClientId(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "";
  const baseId = forwarded || realIp || "unknown";
  const fingerprint = Buffer.from(userAgent).toString("base64").slice(0, 8);

  return `${baseId}_${fingerprint}`;
}

async function checkRateLimit(clientId) {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const maxRequests = 5;

  // If Appwrite is configured, use it for persistent rate limiting
  if (
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
    process.env.APPWRITE_API_KEY &&
    process.env.NEXT_PUBLIC_DATABASE_ID
  ) {
    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const databases = new Databases(client);

      // Try to get existing rate limit record
      let rateLimitDoc;
      try {
        rateLimitDoc = await databases.getDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID,
          "rate_limits",
          clientId
        );
      } catch (error) {
        if (error.code === 404) {
          // Create new rate limit document
          rateLimitDoc = await databases.createDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID,
            "rate_limits",
            clientId,
            {
              clientId: clientId,
              requests: [now],
              lastReset: now,
            }
          );
        } else {
          throw error;
        }
      }

      // Filter recent requests
      const requests = rateLimitDoc.requests || [];
      const recentRequests = requests.filter((time) => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(recentRequests[0] + windowMs),
        };
      }

      // Add current request and update
      recentRequests.push(now);
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID,
        "rate_limits",
        clientId,
        {
          requests: recentRequests,
          lastReset: recentRequests[0],
        }
      );

      return {
        allowed: true,
        remaining: maxRequests - recentRequests.length,
        resetTime: new Date(recentRequests[0] + windowMs),
      };
    } catch (error) {
      console.error(
        "Appwrite rate limiting failed, falling back to memory:",
        error
      );
    }
  }

  // Fallback to in-memory rate limiting 
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

export async function POST(request) {
  try {
    const { errorMessage, language } = await request.json();

    // Input validation
    if (!errorMessage || !language) {
      return NextResponse.json(
        { error: "Error message and language are required" },
        { status: 400 }
      );
    }

    if (errorMessage.length > 2000) {
      return NextResponse.json(
        { error: "Error message too long. Maximum 2000 characters allowed." },
        { status: 400 }
      );
    }

    // Validate input
    if (!isValidError(errorMessage)) {
      return NextResponse.json(
        {
          error:
            "This doesn't appear to be an error message. Please paste an actual error or exception from your code/console.",
          suggestion:
            "Error messages usually contain keywords like 'Error:', 'Exception:', 'TypeError:', stack traces, or line numbers.",
        },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Daily limit reached. You can analyze 5 errors per day.",
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    // Validate environment variables
    if (!process.env.GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Generate AI analysis
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

    // Store in Appwrite database
    let documentId = null;
    if (
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
      process.env.APPWRITE_API_KEY &&
      process.env.NEXT_PUBLIC_DATABASE_ID &&
      process.env.NEXT_PUBLIC_COLLECTION_ID
    ) {
      try {
        // Initialize Appwrite client for server-side
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        // Prepare data according to your Appwrite schema
        const documentData = {
          errorMessage: errorMessage.substring(0, 1000),
          language: language.substring(0, 50),
          explanation: analysis.explanation.substring(0, 2000),
          causes: analysis.causes,
          solutions: analysis.solutions,
        };

        console.log("Attempting to store document:", documentData);

        const document = await databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID,
          process.env.NEXT_PUBLIC_COLLECTION_ID,
          ID.unique(),
          documentData
        );

        documentId = document.$id;
        console.log("Successfully stored in Appwrite:", documentId);
      } catch (dbError) {
        console.error("Failed to store in database:", dbError);
        console.error("Database error details:", {
          message: dbError.message,
          code: dbError.code,
          type: dbError.type,
        });
      }
    } else {
      console.log("Missing Appwrite environment variables:", {
        endpoint: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        projectId: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        apiKey: !!process.env.APPWRITE_API_KEY,
        databaseId: !!process.env.NEXT_PUBLIC_DATABASE_ID,
        collectionId: !!process.env.NEXT_PUBLIC_COLLECTION_ID,
      });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        originalError: errorMessage,
        language: language,
        id: documentId,
      },
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    // Handle specific error types
    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error.message?.includes("Groq") || error.message?.includes("API")) {
      return NextResponse.json(
        {
          error:
            "AI service temporarily unavailable. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process error message. Please try again." },
      { status: 500 }
    );
  }
}
