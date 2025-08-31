import { Terminal, Github } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-4 left-0 right-0 flex justify-center z-50 px-4">
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
          href="https://github.com/your-repo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0E2E28] hover:opacity-90 transition"
        >
          <Github className="text-[#CDFA8A]" size={16} />
        </a>
      </div>
    </header>
  );
}
