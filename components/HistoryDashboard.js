"use client";

import { useState, useEffect } from "react";
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
import ShareButton from "./SharedButton";

// Constants
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
    class: "text-green-600 bg-green-50 border-green-200",
    color: "#22c55e",
  },
  medium: {
    class: "text-yellow-600 bg-yellow-50 border-yellow-200",
    color: "#eab308",
  },
  high: { class: "text-red-600 bg-red-50 border-red-200", color: "#ef4444" },
  default: {
    class: "text-gray-600 bg-gray-50 border-gray-200",
    color: "#94a3b8",
  },
};

const CHART_STYLE = {
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "12px",
  padding: "4px 8px",
};

export default function HistoryDashboard({ onSelectError }) {
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

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user-history");
      const data = await response.json();

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
        setError(null);
      } else {
        setError("Failed to load history");
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Utility functions
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

  const getSeverityConfig = (severity) =>
    SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.default;

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Data preparation
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

  // Stats cards configuration
  const statsCards = [
    {
      label: "Total",
      icon: FileText,
      value: stats.total,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "This Week",
      icon: TrendingUp,
      value: stats.timeline.reduce((sum, day) => sum + day.count, 0),
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Top Lang",
      icon: Code,
      value: topLanguages[0] ? topLanguages[0][0] : "None",
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Critical",
      icon: AlertCircle,
      value: stats.severity.high,
      color: "bg-red-100 text-red-600",
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mb-3" />
        <p className="text-sm text-gray-600">Loading your history...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Load Failed</h3>
        <p className="text-gray-600 mb-4 text-sm">{error}</p>
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

  // Empty state
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-[#0E2E28] mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No History</h3>
        <p className="text-gray-600 text-sm">
          Analyzed errors will appear here
        </p>
      </div>
    );
  }

  // Chart components
  const TimelineChart = () =>
    timelineData.length > 0 && (
      <div className="p-4 rounded-xl bg-white border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Activity
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis hide />
            <Tooltip contentStyle={CHART_STYLE} />
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
      <div className="p-4 rounded-xl bg-white border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
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
            <Tooltip contentStyle={CHART_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );

  const LanguageChart = () =>
    languageData.length > 0 && (
      <div className="p-4 rounded-xl bg-white border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#374151" }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#374151" }}
                />
                <Tooltip contentStyle={CHART_STYLE} />
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

  // Analysis section component
  const AnalysisSection = ({ title, items, bgColor, textColor, dotColor }) =>
    items?.length > 0 && (
      <div className={`${bgColor} p-2.5 rounded-xl`}>
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
                  className={`${textColor.replace(
                    "800",
                    "600"
                  )} font-medium flex-shrink-0`}
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

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {statsCards.map((item, i) => (
          <div
            key={i}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1 rounded-sm ${item.color}`}>
                <item.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-gray-700">{item.label}</span>
            </div>
            <div className="text-gray-900 truncate">{item.value}</div>
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
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Errors
          </h3>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer transition"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {history.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const severityConfig = getSeverityConfig(item.severity);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white transition overflow-hidden"
              >
                {/* Header */}
                <div className="p-2 sm:p-3">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-medium text-gray-900 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-lg sm:rounded-xl">
                          {item.language}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-lg sm:rounded-xl text-xs font-medium border ${severityConfig.class}`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-xs text-gray-500 truncate hidden sm:inline">
                          {item.category}
                        </span>
                      </div>

                      {/* Category for mobile - show below badges */}
                      <div className="text-xs text-gray-500 mb-1.5 sm:hidden">
                        {item.category}
                      </div>

                      {/* Error message with better mobile handling */}
                      <div className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1.5 rounded-lg sm:rounded-xl leading-relaxed">
                        <div
                          className={`break-all ${
                            !isExpanded ? "line-clamp-2 sm:line-clamp-2" : ""
                          }`}
                        >
                          {item.errorMessage}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {formatDate(item.timestamp)}
                          </span>
                          <span className="sm:hidden">
                            {formatDate(item.timestamp, "short")}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Actions - stacked on very small screens */}
                    <div className="flex flex-col sm:flex-row items-center gap-1">
                      <ShareButton
                        errorId={item.id}
                        variant="icon"
                        isShared={item.isShared}
                        existingShareId={item.shareId}
                        className="p-1.5 sm:p-1"
                      />
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="p-1.5 sm:p-1 rounded-xl hover:bg-gray-200 transition cursor-pointer flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && item.analysis && (
                  <div className="px-2 sm:px-3 pb-2 sm:pb-3 border-t border-gray-200">
                    <div className="pt-2 sm:pt-3 space-y-2 sm:space-y-3">
                      <AnalysisSection
                        title="Explanation"
                        items={item.analysis.explanation}
                        bgColor="bg-blue-50"
                        textColor="text-blue-800"
                        dotColor="bg-blue-500"
                      />

                      <AnalysisSection
                        title="Causes"
                        items={item.analysis.causes}
                        bgColor="bg-orange-50"
                        textColor="text-orange-800"
                        dotColor="bg-orange-500"
                      />

                      <AnalysisSection
                        title="Solutions"
                        items={item.analysis.solutions}
                        bgColor="bg-green-50"
                        textColor="text-green-800"
                        dotColor="bg-green-500"
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
