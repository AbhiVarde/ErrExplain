import { Client, Databases, ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { getClientId } from "../utils";

export async function POST(request) {
  try {
    const { errorId } = await request.json();

    if (!errorId) {
      return NextResponse.json(
        { error: "Error ID is required" },
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
    const clientId = getClientId(request);

    try {
      // Get the original error submission
      const errorDoc = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
        errorId
      );

      // Verify ownership
      if (errorDoc.clientId !== clientId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Check if it's marked as private
      if (errorDoc.isPrivate) {
        return NextResponse.json(
          { error: "Cannot share private error analysis" },
          { status: 403 }
        );
      }

      // Check if already shared
      if (errorDoc.isShared && errorDoc.shareId) {
        return NextResponse.json({
          success: true,
          shareId: errorDoc.shareId,
          shareUrl: `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/shared/${errorDoc.shareId}`,
        });
      }

      // Generate unique share ID
      const shareId = ID.unique();

      // Update the document to mark as shared
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ERROR_SUBMISSIONS_COLLECTION_ID,
        errorId,
        {
          isShared: true,
          shareId: shareId,
          sharedAt: new Date().toISOString(),
        }
      );

      const shareUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/shared/${shareId}`;

      return NextResponse.json({
        success: true,
        shareId,
        shareUrl,
      });
    } catch (error) {
      console.error("Error sharing document:", error);
      return NextResponse.json(
        { error: "Failed to share error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Share error API error:", error);
    return NextResponse.json(
      { error: "Failed to process share request" },
      { status: 500 }
    );
  }
}
