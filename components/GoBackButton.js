"use client";

import { ArrowLeft } from "lucide-react";

export default function GoBackButton({ className }) {
  return (
    <button
      onClick={() => window.history.back()}
      className={`flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Go Back
    </button>
  );
}
