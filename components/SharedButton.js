"use client";

import { useState } from "react";
import { Share2, Copy, Check, Loader2, ExternalLink } from "lucide-react";

export default function ShareButton({
  errorId,
  variant = "default",
  isShared = false,
  existingShareId = null,
  onShareComplete,
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    isShared && existingShareId
      ? `${window.location.origin}/shared/${existingShareId}`
      : null
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleShare = async () => {
    if (!errorId) {
      setError("Error ID not found");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const response = await fetch("/api/share-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newShareUrl = data.shareUrl;
        setShareUrl(newShareUrl);

        if (onShareComplete) {
          onShareComplete({
            shareId: data.shareId,
            shareUrl: newShareUrl,
            isShared: true,
          });
        }

        await copyToClipboard(newShareUrl); // auto-copy
      } else {
        setError(data.error || "Failed to create share link");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      setError("Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const openInNewTab = () => {
    if (shareUrl) window.open(shareUrl, "_blank");
  };

  // If already shared, show copy + open controls
  if (shareUrl) {
    if (variant === "icon") {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(shareUrl)}
            className={`p-1.5 cursor-pointer rounded hover:bg-gray-200 transition ${
              copied ? "text-green-600" : "text-gray-600"
            }`}
            title={copied ? "Copied!" : "Copy Link"}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={openInNewTab}
            className="p-1.5 cursor-pointer rounded hover:bg-gray-200 transition text-gray-600"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // default
    return (
      <div className="flex gap-2">
        <button
          onClick={() => copyToClipboard(shareUrl)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm cursor-pointer font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={openInNewTab}
          className="px-3 py-2 border cursor-pointer border-gray-300 rounded-xl hover:bg-gray-50 transition"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            isSharing ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
          title={copied ? "Copied!" : "Share"}
        >
          {isSharing ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
          ) : copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Share2 className="w-4 h-4 text-gray-600" />
          )}
        </button>
      ) : (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition ${
            isSharing ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {isSharing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Link...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </button>
      )}

      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </>
  );
}
