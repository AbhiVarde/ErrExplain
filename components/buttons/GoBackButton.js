"use client";

import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function GoBackButton({ className }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={() => window.history.back()}
      className={`flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition cursor-pointer ${
        theme === "dark"
          ? "text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
          : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
      } ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Go Back
    </button>
  );
}
