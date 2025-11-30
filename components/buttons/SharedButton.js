import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { shareError } from "@/services/apiService";

export default function ShareButton({
  errorId,
  variant = "default",
  isShared = false,
  existingShareId = null,
  isPrivate = false,
  onShareComplete,
  onShowQR,
}) {
  const { theme } = useTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    isShared && existingShareId
      ? `${window.location.origin}/shared/${existingShareId}`
      : null
  );
  const [copied, setCopied] = useState(false);

  if (isPrivate || !errorId) return null;

  const handleShare = async () => {
    if (!errorId) {
      toast.error("Error ID not found");
      return;
    }

    setIsSharing(true);

    try {
      const result = await shareError(errorId);

      if (result.success) {
        const newShareUrl = result.shareUrl;
        setShareUrl(newShareUrl);

        onShareComplete?.({
          shareId: result.shareId,
          shareUrl: newShareUrl,
          isShared: true,
        });

        await copyToClipboard(newShareUrl, true);
      } else {
        toast.error("Failed to create share link");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast.error(err.message || "Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text, fromShare = false) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        toast.error("Failed to copy link");
        document.body.removeChild(textArea);
        return;
      }
      document.body.removeChild(textArea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (fromShare) {
      toast.success("Share link created and copied to clipboard!");
    } else {
      toast.success("Link copied to clipboard!");
    }
  };

  const openInNewTab = () => shareUrl && window.open(shareUrl, "_blank");

  const handleOpenQR = () => {
    if (shareUrl && onShowQR) {
      onShowQR(shareUrl);
    }
  };

  if (shareUrl) {
    if (variant === "icon") {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(shareUrl)}
            className={`p-1.5 cursor-pointer rounded transition ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            } ${
              copied
                ? theme === "dark"
                  ? "text-green-400"
                  : "text-green-600"
                : theme === "dark"
                ? "text-gray-400"
                : "text-gray-600"
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
            className={`p-1.5 cursor-pointer rounded transition ${
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenQR}
            className={`p-1.5 cursor-pointer rounded transition ${
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <button
          onClick={() => copyToClipboard(shareUrl)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm cursor-pointer font-medium border rounded-xl transition ${
            theme === "dark"
              ? "border-gray-600 hover:bg-gray-700 text-gray-300"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
          }`}
        >
          {copied ? (
            <>
              <Check
                className={`w-4 h-4 ${
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }`}
              />
              <span
                className={
                  theme === "dark" ? "text-green-400" : "text-green-600"
                }
              >
                Copied!
              </span>
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
          className={`px-3 py-2 border cursor-pointer rounded-xl transition ${
            theme === "dark"
              ? "border-gray-600 hover:bg-gray-700 text-gray-300"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
          }`}
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          onClick={handleOpenQR}
          className={`px-3 py-2 border cursor-pointer rounded-xl transition ${
            theme === "dark"
              ? "border-gray-600 hover:bg-gray-700 text-gray-300"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
          }`}
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return variant === "icon" ? (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`p-1.5 rounded transition ${
        isSharing ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${
        theme === "dark"
          ? "hover:bg-gray-700 text-gray-400"
          : "hover:bg-gray-200 text-gray-600"
      }`}
      title="Share"
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
    </button>
  ) : (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border rounded-xl transition ${
        isSharing ? "cursor-not-allowed" : "cursor-pointer"
      } ${
        theme === "dark"
          ? "border-gray-600 hover:bg-gray-700 text-gray-300"
          : "border-gray-300 hover:bg-gray-50 text-gray-700"
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
  );
}
