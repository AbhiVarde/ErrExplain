  "use client";

  import { useEffect, useState } from "react";
  import { useParams } from "next/navigation";
  import Link from "next/link";
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

  export default function SharedErrorPage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openAccordions, setOpenAccordions] = useState(
      new Set(["explanation"])
    );
    const [copied, setCopied] = useState(false);

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
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
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
        purple: isOpen
          ? "border-purple-200 bg-purple-50"
          : "border-gray-200 hover:border-purple-200",
      };
      return colors[color] || colors.blue;
    };

    const getIconColor = (color) => {
      const colors = {
        blue: "text-blue-600",
        orange: "text-orange-600",
        green: "text-green-600",
        purple: "text-purple-600",
      };
      return colors[color] || colors.blue;
    };

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const renderAccordionContent = (item) => {
      if (!data?.analysis) return null;

      switch (item.id) {
        case "explanation":
          return data.analysis.explanation ? (
            <div className="text-sm text-gray-700 leading-relaxed">
              {data.analysis.explanation}
            </div>
          ) : null;

        case "causes":
          return data.analysis.causes?.length > 0 ? (
            <ul className="space-y-3">
              {data.analysis.causes.map((cause, i) => (
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
          return data.analysis.solutions?.length > 0 ? (
            <ul className="space-y-3">
              {data.analysis.solutions.map((solution, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
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
              <pre className="text-sm text-gray-700 font-mono bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <code>{data.analysis.exampleCode}</code>
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                This code demonstrates how the error occurs. Compare with your
                code to understand the issue.
              </p>
            </div>
          ) : null;

        default:
          return null;
      }
    };

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0E2E28] mb-3" />
          <p className="text-sm text-gray-600">Loading shared error...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Error Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] font-medium py-2 px-4 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      );
    }

    return (
      <div className="px-4 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-wide text-[#0E2E28] mb-2">
              Shared Error Analysis
            </h1>
            <p className="text-[#0E2E28]/70 text-sm sm:text-base leading-relaxed tracking-wide max-w-2xl mx-auto">
              Collaborative debugging session
            </p>
          </div>

          {/* Main Content */}
          <div className="backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                {/* Error Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/60 rounded-xl border border-gray-200">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-[#0E2E28]/70 mb-2">
                      <FileCode2 className="w-4 h-4" />
                      <span>{data.language}</span> • <span>{data.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#0E2E28]/50">
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

                {/* Error Message */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Error Message:
                  </h3>
                  <pre className="text-sm text-gray-700 font-mono bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                    {data.errorMessage}
                  </pre>
                </div>

                {/* Accordion Analysis */}
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
                              className={`p-1.5 rounded-lg bg-white shadow-sm ${getIconColor(
                                item.color
                              )}`}
                            >
                              <item.icon className="w-4 h-4" />
                            </div>
                            <h3 className="font-medium text-gray-900">
                              {item.title}
                            </h3>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 justify-center">
                  <Link
                    href="/"
                    className="bg-[#CDFA8A] hover:bg-[#B8E678] cursor-pointer text-[#0E2E28] font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Analyze Your Own Errors
                  </Link>

                  <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
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
