"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { X } from "lucide-react";
import { getShareQR } from "@/utils/avatarUtils";

export default function QRDialog({ isOpen, onClose, url }) {
  const { theme } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => setImageLoaded(false), 200);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 z-[999999]"
      onClick={handleClose}
    >
      <div
        className={`${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } rounded-xl p-4 w-full max-w-xs relative transform transition-transform duration-200 ${
          isOpen ? "translate-y-0" : "translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className={`absolute top-2 right-2 p-1 rounded cursor-pointer ${
            theme === "dark"
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          aria-label="Close QR Code"
        >
          <X className="w-4 h-4" />
        </button>

        <h2
          className={`text-lg font-semibold mb-1 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Scan to Open
        </h2>

        <p
          className={`text-sm mb-4 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Scan this QR code to quickly open this page on another device.
        </p>

        <div className="flex justify-center">
          <img
            src={getShareQR(url, 200)}
            alt="QR Code"
            className={`w-48 h-48 rounded transition-all duration-200 ${
              imageLoaded ? "blur-0" : "blur-sm"
            } ${theme === "dark" ? "bg-white p-2" : ""}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
