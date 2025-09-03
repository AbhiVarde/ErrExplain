import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import GoBackButton from "../components/GoBackButton";

export const metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
  robots: "noindex, nofollow",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#0E2E28] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] rounded-lg transition"
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
