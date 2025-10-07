"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FileCode2,
  Info,
  Bug,
  Wrench,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const accordionItems = [
  {
    id: "explanation",
    title: "What Does This Error Mean?",
    icon: Info,
    color: "blue",
  },
  {
    id: "causes",
    title: "What Caused This Error?",
    icon: Bug,
    color: "orange",
  },
  {
    id: "solutions",
    title: "How to Fix This Error?",
    icon: Wrench,
    color: "green",
  },
  {
    id: "exampleCode",
    title: "Example Code (Reproduces Error)",
    icon: FileCode2,
    color: "purple",
  },
];

// Shared Error Page Component
export default function SharedErrorPage() {
  const params = useParams();
  const { theme } = useTheme();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAccordions, setOpenAccordions] = useState(
    new Set(["explanation"])
  );
  const [copied, setCopied] = useState(false);
  const [voteStats, setVoteStats] = useState({});
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    const fetchSharedError = async () => {
      if (!params.sharedId) {
        setError("No share ID provided");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `/api/shared-error?shareId=${params.sharedId}`
        );
        const result = await response.json();
        if (response.ok && result.success) {
          setData(result.data);

          // Fetch votes for this shared error
          try {
            const { getSolutionVotes } = await import("@/services/apiService");
            const votes = await getSolutionVotes(params.sharedId);
            setVoteStats(votes || {});
          } catch (voteErr) {
            console.error("Failed to fetch votes:", voteErr);
          }
        } else {
          setError(result.error || "Failed to load shared error");
        }
      } catch (err) {
        console.error("Error fetching shared error:", err);
        setError("Network error: Failed to load shared error");
      } finally {
        setLoading(false);
      }
    };
    fetchSharedError();
  }, [params.sharedId]);

  const toggleAccordion = (id) => {
    setOpenAccordions((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const getSeverityColor = (severity) => {
    const configs = {
      low: {
        light: "text-green-600 bg-green-50 border-green-200",
        dark: "text-green-400 bg-green-900/30 border-green-700",
      },
      medium: {
        light: "text-yellow-600 bg-yellow-50 border-yellow-200",
        dark: "text-yellow-400 bg-yellow-900/30 border-yellow-700",
      },
      high: {
        light: "text-red-600 bg-red-50 border-red-200",
        dark: "text-red-400 bg-red-900/30 border-red-700",
      },
      default: {
        light: "text-gray-600 bg-gray-50 border-gray-200",
        dark: "text-gray-400 bg-gray-800/30 border-gray-600",
      },
    };
    const config = configs[severity] || configs.default;
    return theme === "dark" ? config.dark : config.light;
  };

  const getAccordionColor = (color, isOpen) => {
    const configs = {
      blue: {
        light: isOpen
          ? "border-blue-200 bg-blue-50"
          : "border-gray-200 hover:border-blue-200",
        dark: isOpen
          ? "border-blue-600 bg-blue-900/20"
          : "border-gray-600 hover:border-blue-600",
      },
      orange: {
        light: isOpen
          ? "border-orange-200 bg-orange-50"
          : "border-gray-200 hover:border-orange-200",
        dark: isOpen
          ? "border-orange-600 bg-orange-900/20"
          : "border-gray-600 hover:border-orange-600",
      },
      green: {
        light: isOpen
          ? "border-green-200 bg-green-50"
          : "border-gray-200 hover:border-green-200",
        dark: isOpen
          ? "border-green-600 bg-green-900/20"
          : "border-gray-600 hover:border-green-600",
      },
      purple: {
        light: isOpen
          ? "border-purple-200 bg-purple-50"
          : "border-gray-200 hover:border-purple-200",
        dark: isOpen
          ? "border-purple-600 bg-purple-900/20"
          : "border-gray-600 hover:border-purple-600",
      },
    };
    const config = configs[color] || configs.blue;
    return theme === "dark" ? config.dark : config.light;
  };

  const getIconColor = (color) => {
    const configs = {
      blue: { light: "text-blue-600", dark: "text-blue-400" },
      orange: { light: "text-orange-600", dark: "text-orange-400" },
      green: { light: "text-green-600", dark: "text-green-400" },
      purple: { light: "text-purple-600", dark: "text-purple-400" },
    };
    const config = configs[color] || configs.blue;
    return theme === "dark" ? config.dark : config.light;
  };

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleVote = async (solutionIndex, voteType) => {
    try {
      const { voteSolution } = await import("@/services/apiService");

      const votes = await voteSolution({
        shareId: params.sharedId,
        solutionIndex,
        voteType,
      });

      // Update local state
      setUserVotes((prev) => ({
        ...prev,
        [solutionIndex]: voteType,
      }));

      // Update vote stats
      setVoteStats((prev) => ({
        ...prev,
        [solutionIndex]: votes,
      }));

      toast.success("Vote recorded!");
    } catch (err) {
      console.error("Vote failed:", err);
      toast.error(err.message || "Failed to record vote");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2
          className={`w-6 h-6 animate-spin ${
            theme === "dark" ? "text-[#CDFA8A]" : "text-[#0E2E28]"
          } mb-3`}
        />
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Loading shared error...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle
          className={`w-12 h-12 mb-4 ${
            theme === "dark" ? "text-red-400" : "text-red-500"
          }`}
        />
        <h1
          className={`text-2xl font-semibold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Error Not Found
        </h1>
        <p
          className={`mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {error}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] font-medium py-2 px-4 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Home
        </Link>
      </div>
    );

  const renderAccordionContent = (item) => {
    if (!data?.analysis) return null;
    switch (item.id) {
      case "explanation":
        return data.analysis.explanation ? (
          <div
            className={`text-sm leading-relaxed ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {data.analysis.explanation}
          </div>
        ) : null;

      case "causes":
        return data.analysis.causes?.length ? (
          <ul className="space-y-3">
            {data.analysis.causes.map((cause, i) => (
              <li
                key={i}
                className={`flex gap-3 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    theme === "dark"
                      ? "bg-orange-800 text-orange-200"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{cause}</span>
              </li>
            ))}
          </ul>
        ) : null;

      case "solutions":
        return data.analysis.solutions?.length ? (
          <ul className="space-y-3">
            {data.analysis.solutions.map((solution, i) => (
              <li
                key={i}
                className={`flex gap-3 text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    theme === "dark"
                      ? "bg-green-800 text-green-200"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{solution}</span>
              </li>
            ))}
          </ul>
        ) : null;

      case "exampleCode":
        return data.analysis.exampleCode ? (
          <div>
            <pre
              className={`text-sm font-mono p-3 rounded border overflow-x-auto whitespace-pre-wrap leading-relaxed ${
                theme === "dark"
                  ? "text-gray-200 bg-gray-900 border-gray-600"
                  : "text-gray-700 bg-white border-gray-300"
              }`}
            >
              <code>{data.analysis.exampleCode}</code>
            </pre>
            <p
              className={`text-xs mt-2 ${
                theme === "dark" ? "text-gray-500" : "text-gray-500"
              }`}
            >
              This code demonstrates how the error occurs. Compare with your
              code to understand the issue.
            </p>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const VotingSection = () => {
    if (!data?.analysis?.solutions?.length) return null;

    return (
      <div
        className={`p-4 rounded-xl border ${
          theme === "dark"
            ? "bg-green-900/20 border-green-700"
            : "bg-green-50 border-green-200"
        }`}
      >
        <h3
          className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
            theme === "dark" ? "text-green-300" : "text-green-800"
          }`}
        >
          <span className="text-lg">🗳️</span>
          Was this helpful?
        </h3>

        <div className="space-y-3">
          {data.analysis.solutions.map((solution, i) => {
            const voteData = voteStats[i];
            const hasVoted = userVotes[i];

            return (
              <div
                key={i}
                className={`p-2.5 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-medium mb-2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Solution {i + 1}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleVote(i, "helpful")}
                    disabled={false}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                      hasVoted === "helpful"
                        ? theme === "dark"
                          ? "bg-green-700 text-green-100 border border-green-600"
                          : "bg-green-200 text-green-800 border border-green-400"
                        : theme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    👍 Helpful{" "}
                    {voteData?.helpful > 0 && `(${voteData.helpful})`}
                  </button>

                  <button
                    onClick={() => handleVote(i, "not_helpful")}
                    disabled={false}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                      hasVoted === "not_helpful"
                        ? theme === "dark"
                          ? "bg-red-700 text-red-100 border border-red-600"
                          : "bg-red-200 text-red-800 border border-red-400"
                        : theme === "dark"
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    👎 Not Helpful
                    {voteData?.notHelpful > 0 && `(${voteData.notHelpful})`}
                  </button>

                  {voteData?.total > 0 && (
                    <span
                      className={`text-xs font-medium ml-auto ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {voteData.percentage}% helpful ({voteData.total})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <h1
            className={`text-2xl lg:text-3xl font-semibold tracking-wide mb-2 ${
              theme === "dark" ? "text-white" : "text-[#0E2E28]"
            }`}
          >
            Shared Error Analysis
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed tracking-wide max-w-2xl mx-auto ${
              theme === "dark" ? "text-white/70" : "text-[#0E2E28]/70"
            }`}
          >
            Collaborative debugging session
          </p>
        </div>

        <div
          className={`backdrop-blur-md rounded-2xl border shadow-lg overflow-hidden ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <div className="p-4 md:p-6">
            <div className="space-y-6">
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800/60 border-gray-600"
                    : "bg-white/60 border-[#e6e6e6]"
                }`}
              >
                <div>
                  <div
                    className={`flex items-center gap-2 text-sm mb-2 ${
                      theme === "dark" ? "text-white/70" : "text-[#0E2E28]/70"
                    }`}
                  >
                    <FileCode2 className="w-4 h-4" />
                    <span>{data.language}</span> • <span>{data.category}</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      theme === "dark" ? "text-white/50" : "text-[#0E2E28]/50"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(data.timestamp)}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full border text-sm font-medium ${getSeverityColor(
                    data.severity
                  )}`}
                >
                  {data.severity} severity
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h3
                  className={`text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Error Message:
                </h3>
                <pre
                  className={`text-sm font-mono p-3 rounded border overflow-x-auto whitespace-pre-wrap ${
                    theme === "dark"
                      ? "text-gray-300 bg-gray-900 border-gray-600"
                      : "text-gray-700 bg-white border-gray-300"
                  }`}
                >
                  {data.errorMessage}
                </pre>
              </div>

              <div className="space-y-4">
                {accordionItems.map((item) => {
                  const isOpen = openAccordions.has(item.id);
                  const hasContent = renderAccordionContent(item);
                  if (!hasContent) return null;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition ${getAccordionColor(
                        item.color,
                        isOpen
                      )}`}
                    >
                      <button
                        onClick={() => toggleAccordion(item.id)}
                        className="w-full p-2.5 cursor-pointer flex items-center justify-between text-left rounded-xl hover:bg-black/5 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg shadow-sm ${getIconColor(
                              item.color
                            )} ${
                              theme === "dark" ? "bg-gray-700" : "bg-white"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                          </div>
                          <h3
                            className={`font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {item.title}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          } ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="py-3">
                            {renderAccordionContent(item)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <VotingSection />

              
              <div
                className={`flex flex-col sm:flex-row gap-3 pt-4 border-t justify-center ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <Link
                  href="/"
                  className="bg-[#CDFA8A] hover:bg-[#B8E678] cursor-pointer text-[#0E2E28] font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Analyze Your Own Errors
                </Link>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-medium border rounded-xl transition ${
                    theme === "dark"
                      ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-green-400" : "text-green-600"
                        }`}
                      />
                      <span
                        className={
                          theme === "dark" ? "text-green-400" : "text-green-600"
                        }
                      >
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
