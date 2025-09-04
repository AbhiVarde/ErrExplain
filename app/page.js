"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  RefreshCcw,
  FileCode2,
  Info,
  Bug,
  Wrench,
  ChevronDown,
  Code,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  History,
} from "lucide-react";
import HistoryDashboard from "../components/HistoryDashboard";
import ShareButton from "@/components/SharedButton";
import { getSampleErrors, detectLanguage } from "./api/utils";

const languages = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "SQL",
  "HTML/CSS",
  "Docker",
  "Git",
  "Linux",
  "Appwrite",
  "Other",
];

const compatibilityMap = {
  JavaScript: ["TypeScript", "React", "Next.js"],
  TypeScript: ["JavaScript", "React", "Next.js"],
  React: ["JavaScript", "TypeScript", "Next.js"],
  "Next.js": ["JavaScript", "TypeScript", "React"],
  "Node.js": ["JavaScript", "TypeScript"],
  "HTML/CSS": ["JavaScript", "React", "Next.js"],
};

const accordionItems = [
  {
    id: "explanation",
    title: "What Does This Error Mean?",
    icon: Info,
    loadingText: "Analyzing error...",
    color: "blue",
  },
  {
    id: "causes",
    title: "What Caused This Error?",
    icon: Bug,
    loadingText: "Identifying causes...",
    color: "orange",
  },
  {
    id: "solutions",
    title: "How to Fix This Error?",
    icon: Wrench,
    loadingText: "Finding solutions...",
    color: "green",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("JavaScript");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [openAccordions, setOpenAccordions] = useState(new Set());
  const [loadingSteps, setLoadingSteps] = useState(new Set());
  const [validationError, setValidationError] = useState("");
  const [rateLimit, setRateLimit] = useState({
    remaining: 5,
    maxRequests: 5,
    resetTime: null,
    canAnalyze: true,
    loading: true,
  });

  const validateErrorMessage = (text) => {
    if (!text || text.trim().length < 8) {
      return {
        isValid: false,
        message: "Please enter at least 8 characters.",
        suggestion: null,
      };
    }

    const cleanText = text.trim();
    let score = 0;

    // comprehensive patterns
    const patterns = [
      // generic
      /\b(error|exception|failed|failure)\s*[:]/i,
      /\b(unhandled exception)\b/i,
      /\bnullreferenceexception\b/i,
      /\bargument(exception|outofrange)\b/i,
      /\bvalue does not fall within\b/i,

      // JS / Python / Java / PHP
      /\b(typeerror|referenceerror|syntaxerror|nameerror|valueerror|keyerror|importerror)\b/i,
      /at\s+.*:\d+:\d+/i,
      /line\s+\d+/i,
      /:\d+:\d+/,
      /cannot\s+(read|find|resolve|access)/i,
      /is\s+not\s+(defined|found|a\s+function)/i,
      /unexpected\s+(token|end)/i,
      /module\s+not\s+found/i,

      // compiler/runtime codes
      /\bCS\d{4}\b/i, // C# compiler error codes
      /\.cs\(\d+,\d+\)/i, // C# file + line
      /\.java:\d+/i,
      /\.py[\s:"]/i,
      /\.php.*line\s+\d+/i,
      /\.cpp:\d+/i,
      /\.ts(x)?:\d+/i,

      // HTTP/server
      /\b(404|500|502|503)\b/i,

      // file extensions as fallback
      /\.(js|py|java|php|cpp|cs|rb|go|rs|swift|kt|sql|html|css)[\s:"]/i,

      // C# specific patterns
      /system\.\w+exception/i,
      /program\.cs:\s*line\s*\d+/i,
      /string\.isnullorempty/i,

      // Ruby specific
      /\.rb:\d+/i,
      /undefined method.*for/i,
      /nomethoderror/i,
      /loaderror.*cannot load/i,
      /nameerror.*undefined local variable/i,

      // Go specific
      /\.go:\d+/i,
      /panic:/i,
      /goroutine \d+/i,
      /undefined:.*fmt\./i,
      /cannot use.*as type/i,

      // SQL specific
      /ERROR \d+/i,
      /duplicate entry/i,
      /syntax error.*near/i,
      /table.*doesn.*exist/i,

      // Linux/Bash specific
      /permission denied/i,
      /command not found/i,
      /segmentation fault/i,
      /bash:.*command not found/i,
      /usr\/bin\/env/i,
      /mkdir:.*permission denied/i,

      // Docker specific
      /failed to solve/i,
      /dockerfile/i,
      /executor failed running/i,
      /pull access denied/i,
      /killed by sigkill/i,

      // Git specific
      /fatal:.*git/i,
      /not a git repository/i,
      /local changes would be overwritten/i,
      /conflict.*content/i,
      /automatic merge failed/i,

      // Swift specific
      /thread.*fatal error/i,
      /viewcontroller\.swift/i,
      /exc_bad_access/i,
      /index out of range/i,
      /appdelegate\.swift/i,

      // Appwrite specific
      /appwriteexception/i,
      /document.*not.*found/i,
      /collection.*not.*found/i,
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(cleanText)) score++;
    });

    if (score >= 1) {
      return { isValid: true };
    }

    return {
      isValid: false,
      message: "This doesn't look like an error message.",
      suggestion:
        "Error messages usually contain keywords like 'Error:', 'TypeError:', 'Exception:', 'CS1002', or stack traces with line numbers.",
    };
  };

  // Fetch rate limit on component mount
  useEffect(() => {
    const fetchRateLimit = async () => {
      try {
        const response = await fetch("/api/analyze-status", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setRateLimit({
            remaining: data.remaining,
            maxRequests: data.maxRequests,
            resetTime: data.resetTime ? new Date(data.resetTime) : null,
            canAnalyze: data.canAnalyze,
            loading: false,
          });
        } else {
          // Fallback if API fails
          setRateLimit((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Error fetching rate limit:", error);
        setRateLimit((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchRateLimit();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".relative")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (errorMessage.trim()) {
      const validation = validateErrorMessage(errorMessage);

      if (!validation.isValid) {
        setValidationError(
          validation.message +
            (validation.suggestion ? `\n\n${validation.suggestion}` : "")
        );
      } else {
        setValidationError("");

        // Auto-detect language and warn about mismatches
        const detectedLang = detectLanguage(errorMessage);
        if (
          detectedLang &&
          detectedLang !== selectedLanguage &&
          !(
            compatibilityMap[selectedLanguage]?.includes(detectedLang) ||
            compatibilityMap[detectedLang]?.includes(selectedLanguage)
          ) &&
          !["Other"].includes(selectedLanguage)
        ) {
          setValidationError(
            `This looks like a ${detectedLang} error, but you've selected ${selectedLanguage}. Consider switching languages for better analysis.`
          );
        }
      }
    } else {
      setValidationError("");
    }
  }, [errorMessage, selectedLanguage]);

  const handleSubmit = async () => {
    if (!errorMessage.trim()) {
      setValidationError("Please enter an error message.");
      return;
    }

    const validation = validateErrorMessage(errorMessage);
    if (!validation.isValid) {
      setValidationError(
        validation.message +
          (validation.suggestion ? `\n\n${validation.suggestion}` : "")
      );
      return;
    }

    if (!rateLimit.canAnalyze) {
      setValidationError(
        "Daily limit reached (5 analyses per day). Please try again tomorrow."
      );
      return;
    }

    setIsLoading(true);
    setAnalysis(null);
    setActiveTab("output");
    setOpenAccordions(new Set());
    setLoadingSteps(new Set());
    setValidationError("");

    try {
      // Simulate step-by-step loading
      for (let i = 0; i < accordionItems.length; i++) {
        setLoadingSteps((prev) => new Set([...prev, accordionItems[i].id]));
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Make actual API call
      const response = await fetch("/api/analyze-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorMessage: errorMessage.trim(),
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setValidationError(data.error);
          setRateLimit((prev) => ({
            ...prev,
            remaining: data.remaining || 0,
            canAnalyze: false,
            resetTime: data.resetTime
              ? new Date(data.resetTime)
              : prev.resetTime,
          }));
        } else if (response.status === 400 && data.suggestion) {
          setValidationError(`${data.error}\n\n${data.suggestion}`);
        } else {
          setValidationError(
            data.error || "Failed to analyze error. Please try again."
          );
        }
        setActiveTab("input");
        return;
      }

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setLoadingSteps(new Set());

        // Update rate limit info from API response
        if (data.rateLimit) {
          setRateLimit((prev) => ({
            remaining: data.rateLimit.remaining,
            maxRequests: prev.maxRequests,
            resetTime: data.rateLimit.resetTime
              ? new Date(data.rateLimit.resetTime)
              : prev.resetTime,
            canAnalyze: data.rateLimit.remaining > 0,
            loading: false,
          }));
        }

        // Auto-open first accordion
        setTimeout(() => {
          setOpenAccordions(new Set(["explanation"]));
        }, 300);
      } else {
        setValidationError("Failed to analyze error. Please try again.");
        setActiveTab("input");
      }
    } catch (err) {
      console.error("Error:", err);
      setValidationError(
        "Network error. Please check your connection and try again."
      );
      setActiveTab("input");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccordion = (id) => {
    if (loadingSteps.has(id) || isLoading) return;

    setOpenAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const insertSampleError = () => {
    if (!rateLimit.canAnalyze) return;

    const samples = getSampleErrors(selectedLanguage);
    const randomError = samples[Math.floor(Math.random() * samples.length)];
    setErrorMessage(randomError);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAccordionColor = (color, isOpen) => {
    const colors = {
      blue: isOpen
        ? "border-blue-200 bg-blue-50"
        : "border-gray-200 hover:border-blue-200",
      orange: isOpen
        ? "border-orange-200 bg-orange-50"
        : "border-gray-200 hover:border-orange-200",
      green: isOpen
        ? "border-green-200 bg-green-50"
        : "border-gray-200 hover:border-green-200",
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600",
      orange: "text-orange-600",
      green: "text-green-600",
    };
    return colors[color] || colors.blue;
  };

  const handleNewAnalysis = () => {
    setActiveTab("input");
    setAnalysis(null);
    setErrorMessage("");
    setOpenAccordions(new Set());
    setLoadingSteps(new Set());
    setValidationError("");
  };

  const handleShareComplete = (shareData) => {
    setAnalysis((prevAnalysis) => ({
      ...prevAnalysis,
      isShared: shareData.isShared,
      shareId: shareData.shareId,
    }));
  };

  // Handle loading error from history
  const handleHistoryErrorSelect = ({
    errorMessage,
    language,
    existingAnalysis,
  }) => {
    setErrorMessage(errorMessage);
    setSelectedLanguage(language);
    if (existingAnalysis) {
      setAnalysis(existingAnalysis);
      setActiveTab("output");
      setOpenAccordions(new Set(["explanation"]));
    } else {
      setActiveTab("input");
    }
  };

  const renderAccordionContent = (item) => {
    if (!analysis) return null;

    switch (item.id) {
      case "explanation":
        return analysis.explanation ? (
          <div className="text-sm text-gray-700 leading-relaxed">
            {analysis.explanation}
          </div>
        ) : null;

      case "causes":
        return analysis.causes?.length > 0 ? (
          <ul className="space-y-3">
            {analysis.causes.map((cause, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{cause}</span>
              </li>
            ))}
          </ul>
        ) : null;

      case "solutions":
        return analysis.solutions?.length > 0 ? (
          <ul className="space-y-3">
            {analysis.solutions.map((solution, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{solution}</span>
              </li>
            ))}
          </ul>
        ) : null;

      default:
        return null;
    }
  };

  const formatResetTime = (resetTime) => {
    if (!resetTime) return "";
    const now = new Date();
    const timeDiff = resetTime.getTime() - now.getTime();

    if (timeDiff <= 0) return "shortly";

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="px-2 sm:px-4 py-12 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl lg:text-3xl font-semibold leading-tight tracking-wide text-[#0E2E28] mb-2">
            Turn Cryptic Errors
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E2E28] to-[#4A7C59]">
              into Plain English
            </span>
          </h1>
          <p className="text-[#0E2E28]/70 text-sm sm:text-base leading-relaxed tracking-wide max-w-2xl mx-auto">
            Instantly analyze errors • Clear explanations • Actionable fixes
          </p>

          {/* Rate limit indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-center sm:text-left">
            {rateLimit.loading ? (
              <div className="flex items-center text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Loading...
              </div>
            ) : rateLimit.canAnalyze ? (
              <div className="flex flex-wrap items-center justify-center sm:justify-start text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                <span>{rateLimit.remaining} analyses remaining today</span>
                {rateLimit.resetTime && (
                  <span className="ml-1 text-gray-500">
                    • Resets in {formatResetTime(rateLimit.resetTime)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center sm:justify-start text-red-600">
                <XCircle className="w-3 h-3 mr-1" />
                <span>Daily limit reached</span>
                {rateLimit.resetTime && (
                  <span className="ml-1 text-gray-500">
                    • Resets in {formatResetTime(rateLimit.resetTime)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white/50">
            <div className="flex divide-x divide-gray-200">
              {/* Input Tab */}
              <button
                onClick={() => setActiveTab("input")}
                className={`group flex-1 min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out
        ${
          activeTab === "input"
            ? "bg-[#0E2E28] text-[#CDFA8A]"
            : "text-gray-600 hover:text-[#0E2E28] hover:bg-gray-100 cursor-pointer"
        }`}
              >
                <Code className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:scale-110" />
                <span className="hidden sm:inline truncate">Error Input</span>
                <span className="sm:hidden truncate">Input</span>
              </button>

              {/* Output Tab */}
              <button
                onClick={() =>
                  (analysis || isLoading) && setActiveTab("output")
                }
                disabled={!analysis && !isLoading}
                className={`group flex-1 min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out
        ${
          activeTab === "output" && (analysis || isLoading)
            ? "bg-[#0E2E28] text-[#CDFA8A]"
            : analysis || isLoading
            ? "text-gray-600 hover:text-[#0E2E28] hover:bg-gray-100 cursor-pointer"
            : "text-gray-400 cursor-not-allowed"
        }`}
              >
                <BarChart3 className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:scale-110" />
                <span className="hidden sm:inline truncate">
                  Analysis Results
                </span>
                <span className="sm:hidden truncate">Results</span>
              </button>

              {/* History Tab */}
              <button
                onClick={() => setActiveTab("history")}
                className={`group flex-1 min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out
        ${
          activeTab === "history"
            ? "bg-[#0E2E28] text-[#CDFA8A]"
            : "text-gray-600 hover:text-[#0E2E28] hover:bg-gray-100 cursor-pointer"
        }`}
              >
                <History className="w-4 h-4 transition-transform duration-200 ease-in-out group-hover:scale-110" />
                <span className="hidden sm:inline truncate">Error History</span>
                <span className="sm:hidden truncate">History</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === "input" && (
              <div className="space-y-6">
                {/* Rate limit warning if limit reached */}
                {!rateLimit.canAnalyze && !rateLimit.loading && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800 mb-1">
                          Daily Limit Reached
                        </h3>
                        <p className="text-sm text-red-700 leading-relaxed">
                          You've used all 5 error analyses for today.
                          {rateLimit.resetTime && (
                            <span>
                              {" "}
                              Your limit will reset in{" "}
                              {formatResetTime(rateLimit.resetTime)}.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Language Selector */}
                <div>
                  <label className="block font-medium text-sm text-[#0E2E28] mb-2">
                    Language / Framework
                  </label>
                  <div className="relative">
                    <button
                      onClick={() =>
                        rateLimit.canAnalyze &&
                        setIsDropdownOpen(!isDropdownOpen)
                      }
                      disabled={!rateLimit.canAnalyze}
                      className={`w-full px-3 py-3 text-sm rounded-xl border bg-white focus:ring-2 focus:ring-[#CDFA8A] focus:outline-none transition flex items-center justify-between text-left ${
                        rateLimit.canAnalyze
                          ? "border-gray-300 cursor-pointer hover:border-gray-400"
                          : "border-gray-200 cursor-not-allowed bg-gray-50 text-gray-400"
                      }`}
                    >
                      <span>{selectedLanguage}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isDropdownOpen && rateLimit.canAnalyze && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-50 overflow-y-auto">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2.5 text-sm text-left transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl ${
                              lang === selectedLanguage
                                ? "bg-[#CDFA8A] text-[#0E2E28] font-medium"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-medium text-sm text-[#0E2E28]">
                      Error Message
                    </label>
                    {rateLimit.canAnalyze && (
                      <button
                        onClick={insertSampleError}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors duration-200 font-medium"
                      >
                        Try sample error
                      </button>
                    )}
                  </div>
                  <textarea
                    value={errorMessage}
                    onChange={(e) =>
                      rateLimit.canAnalyze && setErrorMessage(e.target.value)
                    }
                    disabled={!rateLimit.canAnalyze}
                    placeholder={
                      rateLimit.canAnalyze
                        ? `Paste your error message here...\n\nExample:\nTypeError: Cannot read property 'map' of undefined\nReferenceError: document is not defined`
                        : "Daily limit reached. Please try again tomorrow."
                    }
                    rows={8}
                    maxLength={1000}
                    className={`w-full px-3 py-3 text-sm rounded-xl border resize-none focus:ring-2 focus:ring-[#CDFA8A] focus:outline-none transition ${
                      !rateLimit.canAnalyze
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : validationError
                        ? "border-red-300 bg-red-50"
                        : errorMessage && validateErrorMessage(errorMessage)
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <div className="flex justify-between items-center text-xs mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {errorMessage.length}/1000
                      </span>
                      {rateLimit.canAnalyze &&
                        errorMessage &&
                        validateErrorMessage(errorMessage) && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Valid error detected</span>
                          </div>
                        )}
                    </div>
                    {errorMessage.length > 900 && (
                      <span className="text-orange-600">Approaching limit</span>
                    )}
                  </div>

                  {validationError && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-start gap-2">
                        ⚠️
                        <div className="text-sm text-red-700 leading-relaxed whitespace-pre-line">
                          {validationError}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!errorMessage && rateLimit.canAnalyze && (
                  <div className="mt-4 p-3 rounded-xl border border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-2 text-sm text-blue-700">
                      <span className="mt-0.5 text-base">💡</span>
                      <div>
                        <span className="font-semibold">Tip:</span> Paste error
                        messages containing keywords like{" "}
                        <code className="px-1 py-0.5 bg-blue-100 rounded text-blue-800">
                          Error:
                        </code>
                        ,{" "}
                        <code className="px-1 py-0.5 bg-blue-100 rounded text-blue-800">
                          Exception:
                        </code>
                        , or full stack traces for best results.
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    !errorMessage.trim() ||
                    !!validationError ||
                    isLoading ||
                    !rateLimit.canAnalyze
                  }
                  className={`w-full font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition transform ${
                    rateLimit.canAnalyze &&
                    !validationError &&
                    errorMessage.trim()
                      ? "bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : !rateLimit.canAnalyze ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Daily Limit Reached
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyze Error
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === "output" && (
              <div className="space-y-6">
                {analysis || isLoading ? (
                  <>
                    {/* Header */}
                    {analysis && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-2 bg-white/60 rounded-xl border border-[#e6e6e6]">
                        <div>
                          <h2 className="text-lg font-medium text-[#0E2E28] mb-1">
                            Error Analysis Complete
                          </h2>
                          <div className="flex items-center gap-2 text-sm text-[#0E2E28]/70">
                            <FileCode2 className="w-4 h-4" />
                            <span>{analysis.language}</span> •{" "}
                            <span>{analysis.category}</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full border border-[#e6e6e6] text-sm font-medium ${getSeverityColor(
                            analysis.severity
                          )}`}
                        >
                          {analysis.severity} severity
                        </span>
                      </div>
                    )}

                    {/* Accordion */}
                    <div className="space-y-4">
                      {accordionItems.map((item) => {
                        const isOpen = openAccordions.has(item.id);
                        const isLoadingItem = loadingSteps.has(item.id);
                        const hasContent = renderAccordionContent(item);
                        const isDisabled =
                          !hasContent && !isLoadingItem && !isLoading;

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border border-[#e6e6e6] cursor-pointer transition ${getAccordionColor(
                              item.color,
                              isOpen
                            )} ${isDisabled ? "opacity-50" : ""}`}
                          >
                            <button
                              onClick={() => toggleAccordion(item.id)}
                              disabled={isDisabled}
                              className="w-full p-2.5 flex items-center cursor-pointer justify-between text-left rounded-xl hover:bg-black/5 transition disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1.5 rounded-lg bg-white shadow-sm ${getIconColor(
                                    item.color
                                  )}`}
                                >
                                  <item.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {item.title}
                                  </h3>
                                  {isLoadingItem && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Processing...
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!isDisabled &&
                                (isLoadingItem ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                ) : (
                                  <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                ))}
                            </button>

                            {(isOpen || isLoadingItem) && (
                              <div className="px-4">
                                <div
                                  className={
                                    hasContent && !isLoadingItem ? "py-4" : ""
                                  }
                                >
                                  {renderAccordionContent(item)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    {analysis && !isLoading && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 justify-center">
                        <button
                          onClick={handleNewAnalysis}
                          className="bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] font-medium py-2 px-4 cursor-pointer rounded-xl flex items-center justify-center gap-2 text-sm transition transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          Analyze Another Error
                        </button>
                        {analysis.id && (
                          <ShareButton
                            errorId={analysis.id}
                            isShared={analysis.isShared}
                            existingShareId={analysis.shareId}
                            onShareComplete={handleShareComplete}
                          />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Analysis Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Submit an error message to see the detailed analysis here.
                    </p>
                    <button
                      onClick={() => setActiveTab("input")}
                      className="bg-[#0E2E28] hover:bg-[#0E2E28]/90 text-white font-medium py-2 px-4 rounded-xl transition"
                    >
                      Go to Input Tab
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <HistoryDashboard onSelectError={handleHistoryErrorSelect} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
