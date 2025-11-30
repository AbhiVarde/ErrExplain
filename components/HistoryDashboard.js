import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  Clock,
  TrendingUp,
  AlertCircle,
  Code,
  Calendar,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import ShareButton from "./buttons/SharedButton";
import { toast } from "sonner";
import { getUserHistory, deleteHistoryItem } from "@/services/apiService";

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

const SEVERITY_CONFIG = {
  low: {
    light: "text-green-600 bg-green-50 border-green-200",
    dark: "text-green-400 bg-green-900/30 border-green-700",
    color: "#22c55e",
  },
  medium: {
    light: "text-yellow-600 bg-yellow-50 border-yellow-200",
    dark: "text-yellow-400 bg-yellow-900/30 border-yellow-700",
    color: "#eab308",
  },
  high: {
    light: "text-red-600 bg-red-50 border-red-200",
    dark: "text-red-400 bg-red-900/30 border-red-700",
    color: "#ef4444",
  },
  default: {
    light: "text-gray-600 bg-gray-50 border-gray-200",
    dark: "text-gray-400 bg-gray-800/30 border-gray-600",
    color: "#94a3b8",
  },
};

export default function HistoryDashboard({ onSelectError, onShowQR }) {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    languages: {},
    severity: { low: 0, medium: 0, high: 0 },
    categories: {},
    timeline: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deletingItems, setDeletingItems] = useState(new Set());

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserHistory();

      if (data.success) {
        setHistory(data.history || []);
        setStats(
          data.stats || {
            total: 0,
            languages: {},
            severity: { low: 0, medium: 0, high: 0 },
            categories: {},
            timeline: [],
          }
        );
      } else {
        toast.error("Failed to load history");
        setError("Failed to load history");
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error(err.message || "Failed to load history");
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getSeverityConfig = (severity) => {
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.default;
    return {
      class: theme === "dark" ? config.dark : config.light,
      color: config.color,
    };
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleDeleteItem = async (historyId, errorMessage) => {
    setDeletingItems((prev) => new Set([...prev, historyId]));
    setOpenDropdown(null);

    try {
      await deleteHistoryItem(historyId);

      setHistory((prev) => prev.filter((item) => item.id !== historyId));
      toast.success("Error analysis deleted");
    } catch (err) {
      console.error("Error deleting history item:", err);
      toast.error(err.message || "Failed to delete analysis");
      fetchHistory();
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(historyId);
        return newSet;
      });
    }
  };

  const handleSelectError = (item) => {
    if (onSelectError) {
      onSelectError({
        errorMessage: item.errorMessage,
        language: item.language,
        existingAnalysis: item.analysis,
      });
    }
  };

  const getChartStyle = () => ({
    backgroundColor: theme === "dark" ? "#374151" : "white",
    border: theme === "dark" ? "1px solid #4b5563" : "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    padding: "4px 8px",
    color: theme === "dark" ? "#f3f4f6" : "#374151",
  });

  const topLanguages = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const severityData = [
    { name: "Low", value: stats.severity.low, fill: SEVERITY_CONFIG.low.color },
    {
      name: "Medium",
      value: stats.severity.medium,
      fill: SEVERITY_CONFIG.medium.color,
    },
    {
      name: "High",
      value: stats.severity.high,
      fill: SEVERITY_CONFIG.high.color,
    },
  ];

  const languageData = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const timelineData = stats.timeline.map((day) => ({
    ...day,
    date: day.label,
  }));

  const statsCards = [
    {
      label: "Total",
      icon: FileText,
      value: stats.total,
      color:
        theme === "dark"
          ? "bg-blue-900/30 text-blue-400"
          : "bg-blue-100 text-blue-600",
    },
    {
      label: "This Week",
      icon: TrendingUp,
      value: stats.timeline.reduce((sum, day) => sum + day.count, 0),
      color:
        theme === "dark"
          ? "bg-green-900/30 text-green-400"
          : "bg-green-100 text-green-600",
    },
    {
      label: "Top Lang",
      icon: Code,
      value: topLanguages[0] ? topLanguages[0][0] : "None",
      color:
        theme === "dark"
          ? "bg-purple-900/30 text-purple-400"
          : "bg-purple-100 text-purple-600",
    },
    {
      label: "Critical",
      icon: AlertCircle,
      value: stats.severity.high,
      color:
        theme === "dark"
          ? "bg-red-900/30 text-red-400"
          : "bg-red-100 text-red-600",
    },
  ];

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <RefreshCw
          className={`w-6 h-6 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          } animate-spin mb-3`}
        />
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Loading your history...
        </p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle
          className={`w-10 h-10 ${
            theme === "dark" ? "text-red-400" : "text-red-500"
          } mx-auto mb-3`}
        />
        <h3
          className={`text-lg font-medium ${
            theme === "dark" ? "text-white" : "text-gray-900"
          } mb-2`}
        >
          Load Failed
        </h3>
        <p
          className={`${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          } mb-4 text-sm`}
        >
          {error}
        </p>
        <button
          onClick={fetchHistory}
          className="bg-[#CDFA8A] hover:bg-[#B8E678] text-[#0E2E28] font-medium py-2 px-4 rounded-xl flex items-center gap-2 mx-auto transition text-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Empty
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History
          className={`w-12 h-12 ${
            theme === "dark" ? "text-[#CDFA8A]" : "text-[#0E2E28]"
          } mx-auto mb-3`}
        />
        <h3
          className={`text-lg font-medium ${
            theme === "dark" ? "text-white" : "text-gray-900"
          } mb-2`}
        >
          No History
        </h3>
        <p
          className={`${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          } text-sm`}
        >
          Analyzed errors will appear here
        </p>
      </div>
    );
  }

  // Charts
  const TimelineChart = () =>
    timelineData.length > 0 && (
      <div
        className={`p-4 rounded-xl border ${
          theme === "dark"
            ? "bg-gray-800/50 border-gray-600"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={`text-sm font-medium ${
            theme === "dark" ? "text-white" : "text-gray-900"
          } mb-3 flex items-center gap-2`}
        >
          <Calendar className="w-4 h-4" />
          Activity
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={timelineData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === "dark" ? "#4b5563" : "#f3f4f6"}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: theme === "dark" ? "#d1d5db" : "#6b7280",
              }}
            />
            <YAxis hide />
            <Tooltip contentStyle={getChartStyle()} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );

  const SeverityChart = () =>
    severityData.some((d) => d.value > 0) && (
      <div
        className={`p-4 rounded-xl border ${
          theme === "dark"
            ? "bg-gray-800/50 border-gray-600"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={`text-sm font-medium ${
            theme === "dark" ? "text-white" : "text-gray-900"
          } mb-3 flex items-center gap-2`}
        >
          <AlertCircle
            className={`w-4 h-4 ${
              theme === "dark" ? "text-red-400" : "text-red-500"
            }`}
          />
          Severity
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={severityData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {severityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={getChartStyle()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );

  const LanguageChart = () =>
    languageData.length > 0 && (
      <div
        className={`p-4 rounded-xl border ${
          theme === "dark"
            ? "bg-gray-800/50 border-gray-600"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={`text-sm font-medium ${
            theme === "dark" ? "text-white" : "text-gray-900"
          } mb-3 flex items-center gap-2`}
        >
          <Code className="w-4 h-4" />
          Languages
        </h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[400px] lg:min-w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={languageData}
                margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === "dark" ? "#4b5563" : "#f3f4f6"}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: theme === "dark" ? "#d1d5db" : "#374151",
                  }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: theme === "dark" ? "#d1d5db" : "#374151",
                  }}
                />
                <Tooltip contentStyle={getChartStyle()} />
                <Bar dataKey="value" barSize={28} radius={[6, 6, 0, 0]}>
                  {languageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % 7]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );

  const AnalysisSection = ({ title, items, bgColor, textColor, dotColor }) =>
    items?.length > 0 && (
      <div className={bgColor}>
        <h4
          className={`font-semibold ${textColor} mb-1.5 flex items-center gap-2 text-xs`}
        >
          <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`}></div>
          {title}
        </h4>
        {title === "Explanation" ? (
          <p className={`text-xs ${textColor} leading-relaxed break-all`}>
            {items}
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className={`text-xs ${textColor} flex gap-2`}>
                <span
                  className={`${textColor
                    .replace("800", "600")
                    .replace("300", "400")} font-medium flex-shrink-0`}
                >
                  {i + 1}.
                </span>
                <span className="leading-relaxed break-all">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );

  const CodeSection = ({ title, code, bgColor, textColor, dotColor }) =>
    code && (
      <div className={bgColor}>
        <h4
          className={`font-semibold ${textColor} mb-1.5 flex items-center gap-2 text-xs`}
        >
          <div className={`w-1.5 h-1.5 ${dotColor} rounded-full`}></div>
          {title}
        </h4>
        <pre
          className={`text-xs font-mono p-2 rounded border overflow-x-auto whitespace-pre-wrap leading-relaxed ${
            theme === "dark"
              ? "text-gray-200 bg-gray-900 border-gray-600"
              : "text-black bg-white border-gray-300"
          }`}
        >
          <code>{code}</code>
        </pre>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {statsCards.map((item, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-xl border text-sm font-medium ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1 rounded-sm ${item.color}`}>
                <item.icon className="w-3.5 h-3.5" />
              </div>
              <span
                className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
              >
                {item.label}
              </span>
            </div>
            <div
              className={`truncate ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <TimelineChart />
        <SeverityChart />
      </div>

      <LanguageChart />

      {/* Error History */}
      <div
        className={`p-3 sm:p-4 rounded-xl border ${
          theme === "dark"
            ? "bg-gray-800/50 border-gray-600"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className={`text-sm font-medium ${
              theme === "dark" ? "text-white" : "text-gray-900"
            } flex items-center gap-2`}
          >
            <Clock className="w-4 h-4" />
            Recent Errors ({history.length})
          </h3>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              } ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {history.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const severityConfig = getSeverityConfig(item.severity);
            const isDeleting = deletingItems.has(item.id);

            return (
              <div
                key={item.id}
                className={`rounded-xl border transition relative ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                } ${
                  theme === "dark"
                    ? "border-gray-600 bg-gray-800/30"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Deleting overlay */}
                {isDeleting && (
                  <div className="absolute rounded-xl inset-0 bg-black/60 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="p-2 sm:p-3">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleSelectError(item)}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-lg sm:rounded-xl ${
                            theme === "dark"
                              ? "text-white bg-gray-700"
                              : "text-gray-900 bg-gray-100"
                          }`}
                        >
                          {item.language}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-lg sm:rounded-xl text-xs font-medium border ${severityConfig.class}`}
                        >
                          {item.severity}
                        </span>
                        <span
                          className={`text-xs truncate hidden sm:inline ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Category (mobile) */}
                      <div
                        className={`text-xs mb-1.5 sm:hidden ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {item.category}
                      </div>

                      {/* Error message */}
                      <div
                        className={`text-xs font-mono px-2 py-1.5 rounded-lg sm:rounded-xl leading-relaxed ${
                          theme === "dark"
                            ? "text-gray-300 bg-gray-900/50"
                            : "text-gray-700 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`break-all ${
                            !isExpanded ? "line-clamp-2 sm:line-clamp-2" : ""
                          }`}
                        >
                          {item.errorMessage}
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-2 sm:gap-3 mt-1.5 text-xs ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(item.timestamp)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-1 relative">
                      {!item.isPrivate && (
                        <ShareButton
                          errorId={item.id}
                          variant="icon"
                          isShared={item.isShared}
                          existingShareId={item.shareId}
                          isPrivate={item.isPrivate}
                          onShowQR={onShowQR}
                          className="p-1.5 sm:p-1"
                        />
                      )}

                      {/* More options dropdown */}
                      <div className="dropdown-container relative">
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === item.id ? null : item.id
                            )
                          }
                          className={`p-1.5 sm:p-1 rounded-xl transition cursor-pointer flex-shrink-0 ${
                            theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-200"
                          }`}
                        >
                          <MoreVertical
                            className={`w-4 h-4 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          />
                        </button>

                        {/* Dropdown menu */}
                        {openDropdown === item.id && (
                          <div
                            className={`absolute right-0 top-full mt-1 ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-600"
                                : "bg-white border-gray-200"
                            } border rounded-lg shadow-lg z-50 min-w-[120px]`}
                          >
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className={`w-full px-3 py-2 text-xs text-left transition cursor-pointer flex items-center gap-2 ${
                                theme === "dark"
                                  ? "hover:bg-gray-700 text-gray-300"
                                  : "hover:bg-gray-50 text-gray-700"
                              } first:rounded-t-lg`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  <span>Collapse</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  <span>Expand</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteItem(item.id, item.errorMessage)
                              }
                              disabled={isDeleting}
                              className={`w-full px-3 py-2 text-xs text-left transition cursor-pointer flex items-center gap-2 ${
                                theme === "dark"
                                  ? "hover:bg-red-900/30 text-red-400"
                                  : "hover:bg-red-50 text-red-600"
                              } last:rounded-b-lg border-t ${
                                theme === "dark"
                                  ? "border-gray-600"
                                  : "border-gray-200"
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && item.analysis && (
                  <div
                    className={`px-2 sm:px-3 pb-2 sm:pb-3 border-t ${
                      theme === "dark" ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <div className="pt-2 sm:pt-3 space-y-2 sm:space-y-3">
                      <AnalysisSection
                        title="Explanation"
                        items={item.analysis.explanation}
                        bgColor={
                          theme === "dark"
                            ? "bg-blue-900/20 p-2.5 rounded-xl"
                            : "bg-blue-50 p-2.5 rounded-xl"
                        }
                        textColor={
                          theme === "dark" ? "text-blue-300" : "text-blue-800"
                        }
                        dotColor={
                          theme === "dark" ? "bg-blue-400" : "bg-blue-500"
                        }
                      />

                      <AnalysisSection
                        title="Causes"
                        items={item.analysis.causes}
                        bgColor={
                          theme === "dark"
                            ? "bg-orange-900/20 p-2.5 rounded-xl"
                            : "bg-orange-50 p-2.5 rounded-xl"
                        }
                        textColor={
                          theme === "dark"
                            ? "text-orange-300"
                            : "text-orange-800"
                        }
                        dotColor={
                          theme === "dark" ? "bg-orange-400" : "bg-orange-500"
                        }
                      />

                      <AnalysisSection
                        title="Solutions"
                        items={item.analysis.solutions}
                        bgColor={
                          theme === "dark"
                            ? "bg-green-900/20 p-2.5 rounded-xl"
                            : "bg-green-50 p-2.5 rounded-xl"
                        }
                        textColor={
                          theme === "dark" ? "text-green-300" : "text-green-800"
                        }
                        dotColor={
                          theme === "dark" ? "bg-green-400" : "bg-green-500"
                        }
                      />

                      <CodeSection
                        title="Example Code (Reproduces Error)"
                        code={item.analysis?.exampleCode}
                        bgColor={
                          theme === "dark"
                            ? "bg-purple-900/20 p-2.5 rounded-xl"
                            : "bg-purple-50 p-2.5 rounded-xl"
                        }
                        textColor={
                          theme === "dark"
                            ? "text-purple-300"
                            : "text-purple-800"
                        }
                        dotColor={
                          theme === "dark" ? "bg-purple-400" : "bg-purple-500"
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
