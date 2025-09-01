import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-transparent">
      <div className="max-w-4xl mx-auto py-6 flex flex-col items-center text-center gap-2 px-3 text-sm text-[#0E2E28]">
        {/* Built with */}
        <div className="flex flex-wrap items-center justify-center gap-2 font-medium">
          <span>Built with</span>

          <a
            href="https://ai-sdk.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:opacity-80 transition"
          >
            <Image
              src="https://vercel.com/favicon.ico"
              alt="Vercel AI SDK"
              width={16}
              height={16}
            />
            <span className="hidden sm:inline">Vercel AI SDK</span>
          </a>

          <span>&</span>

          <a
            href="https://appwrite.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:opacity-80 transition"
          >
            <Image
              src="https://appwrite.io/images/logos/logo.svg"
              alt="Appwrite"
              width={16}
              height={16}
            />
            <span className="hidden sm:inline">Appwrite</span>
          </a>

          <span>by</span>
          <a
            href="http://abhivarde.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            abhivarde.in
          </a>
        </div>

        {/* Share / Sponsor */}
        <div>
          If you like it, <span>share on X (Twitter)</span> ·{" "}
          <a
            href="https://github.com/sponsors/AbhiVarde"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            sponsor on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
