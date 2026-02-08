import React from 'react';

export default function NotFound() {
  let isDark = false;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1579762593217-46655e4e7efc?q=80&w=1217&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)" }} />
      <div className={`absolute inset-0 ${isDark ? "bg-black/55" : "bg-white/50"}`} />
      <div className="max-w-lg w-full text-center space-y-8 relative z-10">
        <div className="space-y-4">
          <div className={`text-9xl font-light drop-shadow-lg ${isDark ? "text-white" : "text-black"}`} style={{ textShadow: isDark ? "0 2px 10px rgba(0,0,0,0.5)" : "0 2px 10px rgba(255,255,255,0.8)" }}>
            404
          </div>
          <div className="space-y-2">
            <h1 className={`text-3xl font-medium drop-shadow ${isDark ? "text-white" : "text-black"}`} style={{ textShadow: isDark ? "0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(255,255,255,0.8)" }}>
              Lost in space?
            </h1>
            <p className={`drop-shadow ${isDark ? "text-white" : "text-black"}`} style={{ textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.5)" : "0 1px 4px rgba(255,255,255,0.8)" }}>
              The page you're looking for seems to have drifted away.
            </p>
            <p className={`text-sm drop-shadow ${isDark ? "text-white" : "text-black"}`} style={{ textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.5)" : "0 1px 4px rgba(255,255,255,0.8)" }}>
              Don't worry, you can always navigate back home.
            </p>
          </div>
        </div>
        <a href="/" className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-md transition-colors ${isDark ? "text-white hover:text-white/80 border border-white/30 hover:border-white/50 bg-black/30 backdrop-blur-sm" : "text-black hover:text-black/80 border border-black/30 hover:border-black/50 bg-white/40 backdrop-blur-sm"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </a>
      </div>
    </div>
  );
}