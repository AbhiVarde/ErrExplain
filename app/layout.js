import "./globals.css";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Toaster } from "sonner";

export const metadata = {
  title: "ErrExplain | Turn Cryptic Errors into Plain English",
  description:
    "Instantly translate complex error messages into understandable explanations with AI-powered solutions.",
  keywords: "error translator, debugging, developer tools, AI, error messages",
  authors: [{ name: "ErrExplain" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased transition-colors duration-300 text-gray-900">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex justify-center pt-12">
            <div className="w-full max-w-4xl px-2sm:px-4">{children}</div>
          </main>
          <Footer />
        </div>

        {/* Sonner Toaster */}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #e2e8f0",
              color: "#0f172a",
            },
          }}
        />
      </body>
    </html>
  );
}
