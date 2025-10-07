import { functions } from "@/utils/appwriteClient";

const FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_ID;

// Analyze an error message
export async function analyzeError({
  errorMessage,
  language,
  isPrivate = false,
}) {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ errorMessage, language, isPrivate }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error("Function execution failed:", error);
    throw new Error(error.message || "Failed to analyze error message");
  }
}

// Check rate limit status
export async function checkRateLimit() {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ action: "GET_STATUS" }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (result.error && !result.remaining) {
      console.error("Rate limit check error:", result.error);
      return {
        remaining: 5,
        maxRequests: 5,
        canAnalyze: true,
        loading: false,
      };
    }

    return {
      remaining: result.remaining || 5,
      maxRequests: result.maxRequests || 5,
      resetTime: result.resetTime ? new Date(result.resetTime) : null,
      canAnalyze: result.canAnalyze !== false,
      loading: false,
      clientId: result.clientId,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      remaining: 5,
      maxRequests: 5,
      canAnalyze: true,
      loading: false,
    };
  }
}

// Get client ID
export async function getClientId() {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ action: "GET_CLIENT_ID" }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (result.success && result.clientId) {
      return result.clientId;
    }

    throw new Error("Failed to get client ID");
  } catch (error) {
    console.error("Client ID fetch failed:", error);
    throw new Error(error.message || "Failed to get client ID");
  }
}

// Get user history
export async function getUserHistory() {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ action: "GET_HISTORY" }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (result.success) {
      return result;
    }

    throw new Error(result.error || "Failed to fetch history");
  } catch (error) {
    console.error("History fetch failed:", error);
    throw new Error(error.message || "Failed to fetch user history");
  }
}

// Share an error
export async function shareError(errorId) {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ action: "SHARE_ERROR", errorId }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (result.success) {
      return result;
    }

    throw new Error(result.error || "Failed to share error");
  } catch (error) {
    console.error("Share error failed:", error);
    throw new Error(error.message || "Failed to share error");
  }
}

// Delete a history item
export async function deleteHistoryItem(historyId) {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ action: "DELETE_HISTORY", historyId }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (result.success) {
      return result;
    }

    throw new Error(result.error || "Failed to delete history item");
  } catch (error) {
    console.error("Delete history failed:", error);
    throw new Error(error.message || "Failed to delete history item");
  }
}

// Vote on a solution
export async function voteSolution(shareId, solutionIndex, voteType) {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({
        action: "VOTE_SOLUTION",
        shareId,
        solutionIndex,
        voteType,
      }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (!result.success) {
      throw new Error(result.error || "Failed to record vote");
    }

    return result.votes;
  } catch (error) {
    console.error("Vote submission failed:", error);
    throw new Error(error.message || "Failed to record vote");
  }
}

// Get solution votes for a shared error
export async function getSolutionVotes(shareId) {
  try {
    const response = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({
        action: "GET_SOLUTION_VOTES",
        shareId,
      }),
      false,
      undefined,
      undefined
    );

    const result = JSON.parse(response.responseBody);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch votes");
    }

    return result.votes;
  } catch (error) {
    console.error("Get votes failed:", error);
    throw new Error(error.message || "Failed to fetch votes");
  }
}
