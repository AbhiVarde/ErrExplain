import { Client, Databases, Query } from "node-appwrite";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    // Check if Appwrite is configured
    if (
      !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
      !process.env.APPWRITE_API_KEY ||
      !process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
      !process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID
    ) {
      return NextResponse.json(
        { error: "Sharing service not configured" },
        { status: 500 }
      );
    }

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
      // Find document by shareId
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal("shareId", shareId),
          Query.equal("isShared", true),
          Query.equal("isPrivate", false),
          Query.limit(1),
        ]
      );

      if (response.documents.length === 0) {
        return NextResponse.json(
          { error: "Shared error not found" },
          { status: 404 }
        );
      }

      const doc = response.documents[0];

      // Return sanitized data (remove sensitive info)
      const sharedData = {
        id: doc.$id,
        shareId: doc.shareId,
        errorMessage: doc.errorMessage,
        language: doc.language,
        category: doc.category || "Runtime Error",
        severity: doc.severity || "medium",
        timestamp: doc.$createdAt,
        sharedAt: doc.sharedAt,
        analysis: {
          explanation: doc.explanation,
          causes: doc.causes || [],
          solutions: doc.solutions || [],
          severity: doc.severity || "medium",
          category: doc.category || "Runtime Error",
          exampleCode: doc.exampleCode || null,
        },
      };

      return NextResponse.json({
        success: true,
        data: sharedData,
      });
    } catch (error) {
      console.error("Error fetching shared document:", error);
      return NextResponse.json(
        { error: "Failed to fetch shared error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Shared error API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
