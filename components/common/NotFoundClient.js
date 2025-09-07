"use client";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import GoBackButton from "../GoBackButton";

export default function NotFoundClient() {
  const { theme } = useTheme();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              theme === "dark" ? "bg-red-900/30" : "bg-red-100"
            }`}
          >
            <AlertTriangle
              className={`w-10 h-10 ${
                theme === "dark" ? "text-red-400" : "text-red-500"
              }`}
            />
          </div>
        </div>
        <h1
          className={`text-3xl font-bold mb-2 ${
            theme === "dark" ? "text-white" : "text-[#0E2E28]"
          }`}
        >
          404
        </h1>
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}
        >
          Page Not Found
        </h2>
        <p
          className={`mb-8 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          } text-sm`}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] rounded-lg transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <GoBackButton />
        </div>
      </div>
    </div>
  );
}
