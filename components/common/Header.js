"use client";
import { useState } from "react";
import { Terminal, Github, Sun, Moon, BookOpen } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function Header() {
  const [paused, setPaused] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full bg-[var(--primary-bg)] text-[var(--primary-text)] text-xs sm:text-sm overflow-hidden">
        <div
          className={`whitespace-nowrap py-1 animate-marquee ${
            paused ? "paused" : ""
          }`}
        >
          <span className="mx-4">
            🚀 This project was built during{" "}
            <span className="font-medium">Appwrite Sites Hackathon</span>
          </span>

          <span className="mx-4">
            ⚡{" "}
            <a
              href="https://syncui.design"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              Sync UI
            </a>{" "}
            (85+ GitHub stars, used in 90+ countries)
          </span>

          <span className="mx-4">
            🚀{" "}
            <a
              href="https://idea-tracker-v2.appwrite.network"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              Idea Tracker
            </a>{" "}
            (Appwrite Project of the Month)
          </span>

          <span className="mx-4">
            ✨{" "}
            <a
              href="https://sendra.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              Sendra
            </a>{" "}
            (Resend MCP hackathon project – Appwrite + Resend + Vercel)
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-center px-4">
        <div className="w-full max-w-4xl flex items-center justify-between px-3 py-1.5 rounded-2xl backdrop-blur-xs shadow border border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-[#0E2E28] p-1 rounded-lg flex items-center justify-center">
              <Terminal size={20} className="text-[#CDFA8A]" />
            </div>
            <h1 className="text-md font-semibold text-[var(--text-primary)]">
              ErrExplain
            </h1>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="https://dev.to/abhivarde/errexplain-turning-confusing-errors-into-clear-fixes-42dk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary-bg)] hover:opacity-90 transition"
              title="Read the ErrExplain blog"
            >
              <BookOpen className="text-[var(--primary-text)]" size={16} />
            </a>
            <button
              onClick={toggleTheme}
              className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-full bg-[var(--primary-bg)] hover:opacity-90 transition"
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } theme`}
            >
              {theme === "light" ? (
                <Moon className="text-[var(--primary-text)]" size={16} />
              ) : (
                <Sun className="text-[var(--primary-text)]" size={16} />
              )}
            </button>

            <a
              href="https://github.com/AbhiVarde/ErrExplain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary-bg)] hover:opacity-90 transition"
            >
              <Github className="text-[var(--primary-text)]" size={16} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
