"use client";
import { useState } from "react";
import { Terminal, Github } from "lucide-react";

export default function Header() {
  const [paused, setPaused] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement Bar (pause only on link hover) */}
      <div className="w-full bg-[#0E2E28] text-[#CDFA8A] text-xs sm:text-sm overflow-hidden">
        <div
          className={`whitespace-nowrap py-1 animate-marquee ${
            paused ? "paused" : ""
          }`}
        >
          <span className="mx-4">
            🚀 Built during{" "}
            <span className="font-medium">Appwrite Sites Hackathon</span>
          </span>
          <span className="mx-4">
            🌐 Explore more projects:{" "}
            <a
              href="https://syncui.design"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              SyncUI
            </a>{" "}
            &{" "}
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
            (75+ GitHub ⭐, users in 65+ countries)
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="mt-4 flex justify-center px-4">
        <div className="w-full max-w-4xl flex items-center justify-between px-3 py-1.5 rounded-2xl backdrop-blur-xs bg-white/30 shadow border border-gray-200">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-[#0E2E28] p-1 rounded-lg flex items-center justify-center">
              <Terminal size={20} className="text-[#CDFA8A]" />
            </div>
            <h1 className="text-md font-semibold text-[#0E2E28]">ErrExplain</h1>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/AbhiVarde/ErrExplain"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0E2E28] hover:opacity-90 transition"
          >
            <Github className="text-[#CDFA8A]" size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
