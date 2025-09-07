import { Client, Databases, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { getClientId } from "../utils";

export async function GET(request) {
  try {
    const clientId = getClientId(request);

    // Use existing error-submissions collection
    if (
      !process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
      !process.env.APPWRITE_API_KEY ||
      !process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
      !process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID
    ) {
      return NextResponse.json({
        success: true,
        history: [],
        stats: {
          total: 0,
          languages: {},
          severity: { low: 0, medium: 0, high: 0 },
          categories: {},
          timeline: [],
        },
      });
    }

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
      // Get user's submissions using clientId
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
        [
          Query.equal("clientId", clientId),
          Query.orderDesc("$createdAt"),
          Query.limit(50), // Reasonable limit for history
        ]
      );

      // Transform the data for frontend
      const history = response.documents.map((doc) => ({
        id: doc.$id,
        errorMessage: doc.errorMessage,
        language: doc.language,
        category: doc.category || "Runtime Error",
        severity: doc.severity || "medium",
        timestamp: doc.$createdAt,
        isShared: doc.isShared || false,
        shareId: doc.shareId || null,
        isPrivate: doc.isPrivate || false,
        analysis: {
          explanation: doc.explanation,
          causes: doc.causes || [],
          solutions: doc.solutions || [],
          severity: doc.severity || "medium",
          category: doc.category || "Runtime Error",
          exampleCode: doc.exampleCode || null,
        },
      }));

      // Generate stats from history
      const stats = {
        total: history.length,
        languages: {},
        severity: { low: 0, medium: 0, high: 0 },
        categories: {},
        timeline: [],
      };

      // Calculate stats
      history.forEach((item) => {
        // Language distribution
        stats.languages[item.language] =
          (stats.languages[item.language] || 0) + 1;

        // Severity distribution
        stats.severity[item.severity]++;

        // Category distribution
        stats.categories[item.category] =
          (stats.categories[item.category] || 0) + 1;
      });

      // Generate timeline data (last 7 days) using $createdAt
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = history.filter((item) =>
          item.timestamp.startsWith(dateStr)
        ).length;

        stats.timeline.push({
          date: dateStr,
          count,
          label:
            i === 0
              ? "Today"
              : i === 1
              ? "Yesterday"
              : date.toLocaleDateString("en", { weekday: "short" }),
        });
      }

      return NextResponse.json({
        success: true,
        history,
        stats,
      });
    } catch (error) {
      console.error("Database query failed:", error);
      return NextResponse.json({
        success: true,
        history: [],
        stats: {
          total: 0,
          languages: {},
          severity: { low: 0, medium: 0, high: 0 },
          categories: {},
          timeline: [],
        },
      });
    }
  } catch (error) {
    console.error("User history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const clientId = getClientId(request);
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    if (!historyId) {
      return NextResponse.json(
        { error: "History ID is required" },
        { status: 400 }
      );
    }

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Verify the document belongs to this client
    const doc = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
      historyId
    );

    if (doc.clientId !== clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the document
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
      historyId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete history item" },
      { status: 500 }
    );
  }
}
