import React, { useState, useEffect, useRef, MouseEvent } from "react";
import {
  TrendingUp,
  Coins,
  Percent,
  Download,
  Play,
  Sliders,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Loader2,
  Info,
  Sparkles,
  Code,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Briefcase,
  Layers,
  HelpCircle,
  FileText,
  Sun,
  Moon,
  Activity,
  AlertTriangle,
  Grid3X3,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Trash2,
  FolderPlus,
  Save,
  X,
  RotateCcw
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";

// ETF metadata and sector descriptions
const SECTOR_ETFS = [
  { ticker: "XLK", name: "Technology", desc: "Software, hardware, semiconductors, tech equipment." },
  { ticker: "XLV", name: "Health Care", desc: "Pharma, biotech, healthcare equipment & providers." },
  { ticker: "XLF", name: "Financials", desc: "Banks, insurance, capital markets, consumer finance." },
  { ticker: "XLY", name: "Consumer Discretionary", desc: "Retail, automotive, travel, leisure, luxury goods." },
  { ticker: "XLE", name: "Energy", desc: "Oil, gas, consumable fuels, energy services." },
  { ticker: "XLP", name: "Consumer Staples", desc: "Food, beverages, household & personal products." },
  { ticker: "XLB", name: "Materials", desc: "Chemicals, construction materials, containers, mining." },
  { ticker: "XLRE", name: "Real Estate", desc: "Equity REITs, real estate management & services." },
  { ticker: "XLI", name: "Industrials", desc: "Aerospace, defense, machinery, transport, logistics." },
  { ticker: "XLC", name: "Communication Services", desc: "Telecom, media, entertainment, interactive services." }
];

const FEE_OPTIONS = [
  { value: 0.0000, label: "0.00% (No Fee)" },
  { value: 0.0005, label: "0.05% (Ultra-Low)" },
  { value: 0.0009, label: "0.09% (SPDR Standard)" },
  { value: 0.0012, label: "0.12% (Low)" },
  { value: 0.0015, label: "0.15% (Average Index)" },
  { value: 0.0025, label: "0.25% (Moderate)" },
  { value: 0.0050, label: "0.50% (High)" },
  { value: 0.0075, label: "0.75% (Premium)" },
  { value: 0.0100, label: "1.00% (Active Managed)" }
];

const DCA_OPTIONS = [
  { value: 0, label: "Lump Sum (0 Months)" },
  { value: 12, label: "12 Months" },
  { value: 18, label: "18 Months" },
  { value: 24, label: "24 Months" },
  { value: 30, label: "30 Months" },
  { value: 36, label: "36 Months" },
  { value: 42, label: "42 Months" },
  { value: 48, label: "48 Months" },
  { value: 54, label: "54 Months" },
  { value: 60, label: "60 Months" }
];

const START_DATE_OPTIONS = [
  { value: "1985-01-02", label: "40 Years - Full Long-Term (1985)" },
  { value: "1990-01-02", label: "35 Years - Long Term (1990)" },
  { value: "1995-01-03", label: "30 Years - Pre-Dotcom (1995)" },
  { value: "2000-01-03", label: "25 Years - Dotcom Peak (2000)" },
  { value: "2005-01-03", label: "20 Years - Pre-Financial Crisis (2005)" },
  { value: "2008-01-02", label: "Financial Crisis Shock (2008)" },
  { value: "2009-03-09", label: "GFC Bottom / Recovery (2009)" },
  { value: "2010-01-04", label: "15 Years - Post-Crisis Expansion (2010)" },
  { value: "2015-01-02", label: "10 Years - Modern Sector Era (2015)" },
  { value: "2020-01-02", label: "5 Years - COVID Panic / Liquidity (2020)" },
  { value: "2021-01-04", label: "Inflation & Rate Hike Wave (2021)" },
  { value: "2023-01-03", label: "3 Years - Post-Inflation Peak (2023)" },
  { value: "2025-01-02", label: "1 Year - Short-Term Baseline (2025)" },
  { value: "custom", label: "Custom Date..." }
];

// Helper to calculate start-to-today range
const todayMinusOneBusDay = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const getCorrelationColor = (val: number, theme: string) => {
  if (val >= 0.85) {
    return {
      bg: theme === "dark" ? "bg-blue-600/30 text-blue-300 border-blue-500/40" : "bg-blue-100 text-blue-800 border-blue-200",
      glow: "shadow-[0_0_12px_rgba(37,99,235,0.15)]",
      badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
    };
  } else if (val >= 0.60) {
    return {
      bg: theme === "dark" ? "bg-blue-600/20 text-blue-400 border-blue-600/20" : "bg-blue-50 text-blue-700 border-blue-100",
      glow: "",
      badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
    };
  } else if (val >= 0.30) {
    return {
      bg: theme === "dark" ? "bg-slate-800/60 text-slate-300 border-slate-700/30" : "bg-slate-100/70 text-slate-700 border-slate-200/50",
      glow: "",
      badge: "bg-slate-700/20 text-slate-400 border border-slate-600/20"
    };
  } else if (val >= -0.10) {
    return {
      bg: theme === "dark" ? "bg-slate-900/40 text-slate-400 border-slate-800/40" : "bg-slate-50 text-slate-500 border-slate-100",
      glow: "",
      badge: "bg-slate-800/50 text-slate-500 border border-slate-700/20"
    };
  } else {
    return {
      bg: theme === "dark" ? "bg-rose-500/20 text-rose-300 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-100",
      glow: "shadow-[0_0_12px_rgba(244,63,94,0.1)]",
      badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20"
    };
  }
};

export interface PortfolioPreset {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  isBuiltIn?: boolean;
  selectedEtfs: string[];
  weights: Record<string, number>;
  fees: Record<string, number>;
  startDate: string;
  startDateOption: string;
  initialInvestment: number;
  monthlyContribution: number;
  dcaMonths: number;
  dcaStrategy: string;
  dcaMaPeriod: number;
  dcaRefType: string;
  comparisonBenchmark: string;
  rebalanceAnnually: boolean;
  createdAt?: string;
}

const BUILT_IN_PRESETS: PortfolioPreset[] = [
  {
    id: "preset-balanced-core",
    name: "Balanced Core Growth",
    description: "Technology, Healthcare and Financials with 12-mo DCA & annual rebalancing.",
    tag: "Balanced",
    isBuiltIn: true,
    selectedEtfs: ["XLK", "XLV", "XLF"],
    weights: { XLK: 40, XLV: 30, XLF: 30 },
    fees: { XLK: 0.0009, XLV: 0.0009, XLF: 0.0009 },
    startDate: "2020-01-02",
    startDateOption: "2020-01-02",
    initialInvestment: 10000,
    monthlyContribution: 500,
    dcaMonths: 12,
    dcaStrategy: "fixed",
    dcaMaPeriod: 200,
    dcaRefType: "portfolio",
    comparisonBenchmark: "QQQ",
    rebalanceAnnually: true
  },
  {
    id: "preset-defensive-dividend",
    name: "Defensive Low-Volatility",
    description: "Healthcare, Consumer Staples and Industrials over 24-mo steady accumulation.",
    tag: "Defensive",
    isBuiltIn: true,
    selectedEtfs: ["XLV", "XLP", "XLI"],
    weights: { XLV: 40, XLP: 35, XLI: 25 },
    fees: { XLV: 0.0009, XLP: 0.0009, XLI: 0.0009 },
    startDate: "2020-01-02",
    startDateOption: "2020-01-02",
    initialInvestment: 10000,
    monthlyContribution: 400,
    dcaMonths: 24,
    dcaStrategy: "fixed",
    dcaMaPeriod: 200,
    dcaRefType: "portfolio",
    comparisonBenchmark: "SPY",
    rebalanceAnnually: true
  },
  {
    id: "preset-dynamic-cyclical",
    name: "Tech & Discretionary (Dynamic DCA)",
    description: "Aggressive growth basket utilizing 200-SMA Value Averaging with momentum drift.",
    tag: "Aggressive",
    isBuiltIn: true,
    selectedEtfs: ["XLK", "XLY", "XLF"],
    weights: { XLK: 50, XLY: 25, XLF: 25 },
    fees: { XLK: 0.0009, XLY: 0.0009, XLF: 0.0009 },
    startDate: "2020-01-02",
    startDateOption: "2020-01-02",
    initialInvestment: 15000,
    monthlyContribution: 600,
    dcaMonths: 24,
    dcaStrategy: "value_averaging",
    dcaMaPeriod: 200,
    dcaRefType: "portfolio",
    comparisonBenchmark: "QQQ",
    rebalanceAnnually: false
  },
  {
    id: "preset-real-assets",
    name: "Real Assets & Inflation Hedge",
    description: "Energy, Materials and Industrials cyclically balanced to hedge inflation waves.",
    tag: "Real Assets",
    isBuiltIn: true,
    selectedEtfs: ["XLE", "XLB", "XLI"],
    weights: { XLE: 40, XLB: 30, XLI: 30 },
    fees: { XLE: 0.0009, XLB: 0.0009, XLI: 0.0009 },
    startDate: "2020-01-02",
    startDateOption: "2020-01-02",
    initialInvestment: 10000,
    monthlyContribution: 500,
    dcaMonths: 18,
    dcaStrategy: "fixed",
    dcaMaPeriod: 200,
    dcaRefType: "portfolio",
    comparisonBenchmark: "SPY",
    rebalanceAnnually: true
  }
];

export default function App() {
  // App parameters
  const [selectedEtfs, setSelectedEtfs] = useState<string[]>(["XLK", "XLV", "XLF"]);
  const [weights, setWeights] = useState<Record<string, number>>({ XLK: 40, XLV: 30, XLF: 30 });
  const [startDate, setStartDate] = useState<string>("2020-01-02");
  const [startDateOption, setStartDateOption] = useState<string>("2020-01-02");
  const [dcaMonths, setDcaMonths] = useState<number>(12);
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [fees, setFees] = useState<Record<string, number>>({ XLK: 0.0009, XLV: 0.0009, XLF: 0.0009 });
  const [comparisonBenchmark, setComparisonBenchmark] = useState<string>("QQQ");
  const [dcaStrategy, setDcaStrategy] = useState<string>("fixed");
  const [dcaMaPeriod, setDcaMaPeriod] = useState<number>(200);
  const [dcaRefType, setDcaRefType] = useState<string>("portfolio");
  const [rebalanceAnnually, setRebalanceAnnually] = useState<boolean>(true);

  // Strategy Presets State (localStorage persistence)
  const [savedPresets, setSavedPresets] = useState<PortfolioPreset[]>(() => {
    try {
      const raw = localStorage.getItem("portfolio_presets_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse portfolio_presets_v1 from localStorage", e);
    }
    return [];
  });
  const [activePresetId, setActivePresetId] = useState<string>("preset-balanced-core");
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  // Backtest states
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<"charts" | "table" | "heatmap" | "python" | "ai" | "correlation">("charts");
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    Portfolio: true,
    Component1: true,
    Component2: true,
    Component3: true,
    Unrebalanced: false,
    Rebalanced: false
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [heatmapYear, setHeatmapYear] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);
  const [hoveredCorrCell, setHoveredCorrCell] = useState<{ t1: string; t2: string; val: number } | null>(null);
  const [stressIndicator, setStressIndicator] = useState<"volatility" | "atr" | "none">("volatility");
  
  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Pagination for historical table
  const [tablePage, setTablePage] = useState<number>(1);
  const rowsPerPage = 15;

  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Max date is today - 1 business day
  const maxDate = todayMinusOneBusDay();

  // Run backtest automatically when parameters change (debounced to avoid spamming on slider drag)
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (selectedEtfs.length !== 3) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      handleRunBacktest();
      return;
    }

    const timer = setTimeout(() => {
      handleRunBacktest();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    selectedEtfs,
    weights,
    initialInvestment,
    monthlyContribution,
    dcaMonths,
    startDate,
    comparisonBenchmark,
    fees,
    dcaStrategy,
    dcaMaPeriod,
    dcaRefType,
    rebalanceAnnually
  ]);

  // Sync default heatmap year when backtestResult is loaded
  useEffect(() => {
    if (backtestResult && !heatmapYear) {
      const yearsSet = new Set<number>();
      backtestResult.dates.forEach((dateStr: string) => {
        const y = parseInt(dateStr.substring(0, 4));
        if (!isNaN(y)) {
          yearsSet.add(y);
        }
      });
      const yearsArr = Array.from(yearsSet).sort((a, b) => b - a);
      if (yearsArr.length > 0) {
        setHeatmapYear(yearsArr[0]);
      }
    }
  }, [backtestResult, heatmapYear]);

  // Sync weights when selected ETFs change
  const handleToggleEtf = (ticker: string) => {
    if (selectedEtfs.includes(ticker)) {
      if (selectedEtfs.length <= 1) return; // Must have at least 1, though we enforce exactly 3 for backtest
      const updated = selectedEtfs.filter(t => t !== ticker);
      setSelectedEtfs(updated);
      
      // Clean weights and fees
      const updatedWeights = { ...weights };
      delete updatedWeights[ticker];
      setWeights(updatedWeights);
    } else {
      if (selectedEtfs.length >= 3) {
        // Replace the last selected ETF to stay at exactly 3
        const updated = [...selectedEtfs.slice(0, 2), ticker];
        setSelectedEtfs(updated);
        
        // Setup default equal weight for the new one and adjust
        rebalanceEqual(updated);
      } else {
        const updated = [...selectedEtfs, ticker];
        setSelectedEtfs(updated);
        rebalanceEqual(updated);
      }
    }
  };

  const rebalanceEqual = (currentList: string[]) => {
    const list = currentList.length > 0 ? currentList : selectedEtfs;
    const count = list.length;
    const baseVal = Math.floor(100 / count);
    const remainder = 100 - baseVal * count;
    
    const newWeights: Record<string, number> = {};
    list.forEach((t, idx) => {
      newWeights[t] = baseVal + (idx === count - 1 ? remainder : 0);
    });
    setWeights(newWeights);

    // Set standard SPDR fee default if not exists
    const newFees = { ...fees };
    list.forEach(t => {
      if (newFees[t] === undefined) {
        newFees[t] = 0.0009;
      }
    });
    setFees(newFees);
  };

  const handleWeightChange = (ticker: string, value: number) => {
    // Basic reactive weight slider adjustment:
    // When modifying one weight, we adjust the other selected weights to make sure they sum to 100
    const otherTickers = selectedEtfs.filter(t => t !== ticker);
    if (otherTickers.length === 0) {
      setWeights({ [ticker]: 100 });
      return;
    }

    const currentVal = Math.min(Math.max(value, 0), 100);
    const remaining = 100 - currentVal;
    
    // Distribute remaining weights among others proportionally or equally
    const sumOthers = otherTickers.reduce((sum, t) => sum + (weights[t] || 0), 0);
    const updatedWeights = { ...weights, [ticker]: currentVal };
    
    if (sumOthers === 0) {
      otherTickers.forEach((t, idx) => {
        updatedWeights[t] = Math.floor(remaining / otherTickers.length) + (idx === 0 ? remaining % otherTickers.length : 0);
      });
    } else {
      let allocated = 0;
      otherTickers.forEach((t, idx) => {
        if (idx === otherTickers.length - 1) {
          updatedWeights[t] = remaining - allocated;
        } else {
          const share = Math.round((weights[t] / sumOthers) * remaining);
          updatedWeights[t] = share;
          allocated += share;
        }
      });
    }
    setWeights(updatedWeights);
  };

  const handleFeeChange = (ticker: string, val: number) => {
    setFees({ ...fees, [ticker]: val });
  };

  // Strategy Presets Handlers
  const handleApplyPreset = (preset: PortfolioPreset) => {
    setSelectedEtfs(preset.selectedEtfs);
    setWeights(preset.weights);
    setFees(preset.fees || {
      [preset.selectedEtfs[0]]: 0.0009,
      [preset.selectedEtfs[1]]: 0.0009,
      [preset.selectedEtfs[2]]: 0.0009
    });
    setStartDate(preset.startDate);
    setStartDateOption(preset.startDateOption || preset.startDate);
    setInitialInvestment(preset.initialInvestment);
    setMonthlyContribution(preset.monthlyContribution);
    setDcaMonths(preset.dcaMonths);
    setDcaStrategy(preset.dcaStrategy || "fixed");
    setDcaMaPeriod(preset.dcaMaPeriod ?? 200);
    setDcaRefType(preset.dcaRefType ?? "portfolio");
    setComparisonBenchmark(preset.comparisonBenchmark || "QQQ");
    setRebalanceAnnually(preset.rebalanceAnnually !== undefined ? preset.rebalanceAnnually : true);
    setActivePresetId(preset.id);
    setPresetFeedback(`Strategy preset applied: "${preset.name}"`);
    setTimeout(() => {
      setPresetFeedback(null);
    }, 3500);
  };

  const handleSavePreset = () => {
    const trimmed = newPresetName.trim();
    const finalName = trimmed || `Custom Strategy ${savedPresets.length + 1}`;
    const newPreset: PortfolioPreset = {
      id: `custom-${Date.now()}`,
      name: finalName,
      description: `Custom ${selectedEtfs.join("-")} allocation (${selectedEtfs.map(t => `${t} ${weights[t] || 33}%`).join(", ")})`,
      tag: "Custom",
      isBuiltIn: false,
      selectedEtfs: [...selectedEtfs],
      weights: { ...weights },
      fees: { ...fees },
      startDate,
      startDateOption,
      initialInvestment,
      monthlyContribution,
      dcaMonths,
      dcaStrategy,
      dcaMaPeriod,
      dcaRefType,
      comparisonBenchmark,
      rebalanceAnnually,
      createdAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    };

    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    try {
      localStorage.setItem("portfolio_presets_v1", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save preset to localStorage", e);
    }
    setActivePresetId(newPreset.id);
    setIsSavingPreset(false);
    setNewPresetName("");
    setPresetFeedback(`Strategy preset "${finalName}" saved to localStorage!`);
    setTimeout(() => {
      setPresetFeedback(null);
    }, 3500);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = savedPresets.find(p => p.id === id);
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem("portfolio_presets_v1", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to delete preset from localStorage", e);
    }
    if (activePresetId === id) {
      setActivePresetId("");
    }
    setPresetFeedback(`Deleted preset "${target?.name || 'strategy'}"`);
    setTimeout(() => {
      setPresetFeedback(null);
    }, 3500);
  };

  const handleRunBacktest = async () => {
    if (selectedEtfs.length !== 3) {
      setError("Please select exactly 3 ETFs for your portfolio analysis.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiAnalysis(null);

    try {
      // Build weight array mapped to selectedEtfs
      const weightArray = selectedEtfs.map(t => weights[t] || 33.33);
      
      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickers: selectedEtfs,
          weights: weightArray,
          startDate,
          dcaMonths,
          fees,
          initialInvestment,
          monthlyContribution,
          comparisonBenchmark,
          dcaStrategy,
          dcaMaPeriod,
          dcaRefType,
          rebalanceAnnually
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to execute backtest calculation.");
      }

      setBacktestResult(data);
      // Set default heatmap year to the most recent year in the results
      const yearsSet = new Set<number>();
      data.dates.forEach((dateStr: string) => {
        const y = parseInt(dateStr.substring(0, 4));
        if (!isNaN(y)) {
          yearsSet.add(y);
        }
      });
      const yearsArr = Array.from(yearsSet).sort((a, b) => b - a);
      if (yearsArr.length > 0) {
        setHeatmapYear(yearsArr[0]);
      }

      // Reset visible lines
      setVisibleLines({
        Portfolio: true,
        [selectedEtfs[0]]: true,
        [selectedEtfs[1]]: true,
        [selectedEtfs[2]]: true,
        [comparisonBenchmark]: true,
        Unrebalanced: false,
        Rebalanced: false
      });
      setTablePage(1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during calculation.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger Gemini Portfolio Analysis
  const handleGenerateAiAnalysis = async () => {
    if (!backtestResult) return;
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const weightArray = selectedEtfs.map(t => weights[t] || 33.33);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backtestData: { summary: backtestResult.summary },
          params: {
            tickers: selectedEtfs,
            weights: weightArray,
            startDate,
            dcaMonths,
            fees,
            initialInvestment,
            monthlyContribution,
            rebalanceAnnually
          }
        })
      });

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
      setAiAnalysis("### ⚠️ Connection Error\n\nFailed to communicate with the analysis server. Please check your network and try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!backtestResult?.pythonCode) return;
    navigator.clipboard.writeText(backtestResult.pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert raw backtest arrays into Recharts compatible series
  const getChartData = () => {
    if (!backtestResult) return [];
    const t0 = selectedEtfs[0];
    const t1 = selectedEtfs[1];
    const t2 = selectedEtfs[2];
    const bmk = backtestResult.benchmarkTicker;
    
    return backtestResult.dates.map((date: string, idx: number) => {
      const row: any = { date };
      
      if (visibleLines.Portfolio) {
        row.Portfolio = parseFloat((backtestResult.portfolioReturns[idx] * 100).toFixed(2));
      }
      if (visibleLines[t0]) {
        row[t0] = parseFloat((backtestResult.componentReturns[t0]?.[idx] * 100).toFixed(2));
      }
      if (visibleLines[t1]) {
        row[t1] = parseFloat((backtestResult.componentReturns[t1]?.[idx] * 100).toFixed(2));
      }
      if (visibleLines[t2]) {
        row[t2] = parseFloat((backtestResult.componentReturns[t2]?.[idx] * 100).toFixed(2));
      }
      if (bmk && visibleLines[bmk] && backtestResult.benchmarkReturns) {
        row[bmk] = parseFloat((backtestResult.benchmarkReturns[idx] * 100).toFixed(2));
      }
      
      const invested = backtestResult.cumulativeContributions[idx] || backtestResult.summary.totalInvestment;
      if (visibleLines.Unrebalanced && backtestResult.unrebalancedValues) {
        row.Unrebalanced = parseFloat(((backtestResult.unrebalancedValues[idx] / invested - 1) * 100).toFixed(2));
      }
      if (visibleLines.Rebalanced && backtestResult.rebalancedValues) {
        row.Rebalanced = parseFloat(((backtestResult.rebalancedValues[idx] / invested - 1) * 100).toFixed(2));
      }
      
      row.volatility = backtestResult.volatilityHistory ? backtestResult.volatilityHistory[idx] || 0 : 0;
      row.atr = backtestResult.atrHistory ? backtestResult.atrHistory[idx] || 0 : 0;
      
      return row;
    });
  };

  const toggleLine = (lineKey: string) => {
    setVisibleLines({
      ...visibleLines,
      [lineKey]: !visibleLines[lineKey]
    });
  };

  // Custom markdown simple parser
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h3 key={idx} id={`ai-h3-${idx}`} className="text-base font-sans font-semibold text-slate-100 mt-5 mb-2">
            {trimmed.replace("###", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h2 key={idx} id={`ai-h2-${idx}`} className="text-lg font-sans font-bold text-white mt-6 mb-3 border-b border-slate-800 pb-1.5">
            {trimmed.replace("##", "").trim()}
          </h2>
        );
      }
      if (trimmed.startsWith("#")) {
        return (
          <h1 key={idx} id={`ai-h1-${idx}`} className="text-xl font-sans font-extrabold text-white mt-8 mb-4">
            {trimmed.replace("#", "").trim()}
          </h1>
        );
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const content = trimmed.substring(1).trim();
        return (
          <li key={idx} id={`ai-li-${idx}`} className="ml-5 list-disc text-slate-300 my-1 leading-relaxed text-sm">
            {parseBold(content)}
          </li>
        );
      }
      if (trimmed === "") {
        return <div key={idx} id={`ai-space-${idx}`} className="h-2"></div>;
      }
      return (
        <p key={idx} id={`ai-p-${idx}`} className="text-slate-300 my-2 leading-relaxed text-sm">
          {parseBold(trimmed)}
        </p>
      );
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split("**");
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Table pagination math
  const getTableRows = () => {
    if (!backtestResult) return { sliced: [], total: 0 };
    const t0 = selectedEtfs[0];
    const t1 = selectedEtfs[1];
    const t2 = selectedEtfs[2];

    const allRows = backtestResult.dates.map((date: string, idx: number) => ({
      date,
      portfolioVal: backtestResult.portfolioValues[idx],
      portfolioRet: backtestResult.portfolioReturns[idx] * 100,
      contributed: backtestResult.cumulativeContributions[idx],
      isRebalanced: backtestResult.rebalanceDates?.includes(date) || false,
      rebalancedVal: backtestResult.rebalancedValues?.[idx] || backtestResult.portfolioValues[idx],
      unrebalancedVal: backtestResult.unrebalancedValues?.[idx] || backtestResult.portfolioValues[idx],
      t0Val: backtestResult.componentValues[t0]?.[idx] || 0,
      t1Val: backtestResult.componentValues[t1]?.[idx] || 0,
      t2Val: backtestResult.componentValues[t2]?.[idx] || 0
    })).reverse(); // Reverse to show latest first

    const startIndex = (tablePage - 1) * rowsPerPage;
    return {
      sliced: allRows.slice(startIndex, startIndex + rowsPerPage),
      total: allRows.length
    };
  };

  const { sliced: paginatedTableRows, total: totalTableRows } = getTableRows();
  const totalPages = Math.ceil(totalTableRows / rowsPerPage) || 1;

  const handleExportCsv = () => {
    if (!backtestResult) return;
    const t0 = selectedEtfs[0];
    const t1 = selectedEtfs[1];
    const t2 = selectedEtfs[2];

    const headers = [
      "Date",
      "Portfolio Value ($)",
      "Cumulative Return (%)",
      "Capital Invested ($)",
      "Rebalance Event",
      "Rebalanced Value ($)",
      "Unrebalanced (Drift) Value ($)",
      `${t0} Value ($)`,
      `${t1} Value ($)`,
      `${t2} Value ($)`
    ];

    const rows = backtestResult.dates.map((date: string, idx: number) => {
      const pVal = backtestResult.portfolioValues[idx];
      const pRet = backtestResult.portfolioReturns[idx] * 100;
      const contributed = backtestResult.cumulativeContributions[idx];
      const isRebal = backtestResult.rebalanceDates?.includes(date) ? "YES" : "NO";
      const rebVal = backtestResult.rebalancedValues?.[idx] || pVal;
      const unrebVal = backtestResult.unrebalancedValues?.[idx] || pVal;
      const t0Val = backtestResult.componentValues[t0]?.[idx] || 0;
      const t1Val = backtestResult.componentValues[t1]?.[idx] || 0;
      const t2Val = backtestResult.componentValues[t2]?.[idx] || 0;

      return [
        date,
        pVal.toFixed(2),
        pRet.toFixed(4),
        contributed,
        isRebal,
        rebVal.toFixed(2),
        unrebVal.toFixed(2),
        t0Val.toFixed(2),
        t1Val.toFixed(2),
        t2Val.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `sectorflow_backtest_${selectedEtfs.join("_")}_${startDate}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAvailableYears = () => {
    if (!backtestResult) return [];
    const yearsSet = new Set<number>();
    backtestResult.dates.forEach((dateStr: string) => {
      const y = parseInt(dateStr.substring(0, 4));
      if (!isNaN(y)) {
        yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  };

  const getDaysInYear = (year: number) => {
    const days = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      days.push({
        dateStr,
        dayOfWeek: current.getDay(), // 0 = Sunday, 1 = Monday, etc.
        month: current.getMonth(),
        dayOfMonth: current.getDate(),
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getYearlyMetrics = (year: number) => {
    if (!backtestResult) return null;
    
    let totalTradingDays = 0;
    let positiveDays = 0;
    let negativeDays = 0;
    let flatDays = 0;
    let bestDay = { date: "", return: -Infinity };
    let worstDay = { date: "", return: Infinity };
    let yearStartValue = 0;
    let yearEndValue = 0;
    
    backtestResult.dates.forEach((dateStr: string, idx: number) => {
      if (dateStr.startsWith(String(year))) {
        totalTradingDays++;
        const pVal = backtestResult.portfolioValues[idx];
        const prevVal = idx > 0 ? backtestResult.portfolioValues[idx - 1] : pVal;
        const dailyReturn = idx > 0 && prevVal > 0 ? (pVal - prevVal) / prevVal : 0;
        
        if (dailyReturn > 0.0005) {
          positiveDays++;
        } else if (dailyReturn < -0.0005) {
          negativeDays++;
        } else {
          flatDays++;
        }
        
        if (dailyReturn > bestDay.return) {
          bestDay = { date: dateStr, return: dailyReturn };
        }
        if (dailyReturn < worstDay.return) {
          worstDay = { date: dateStr, return: dailyReturn };
        }
        
        if (yearStartValue === 0) {
          yearStartValue = prevVal;
        }
        yearEndValue = pVal;
      }
    });
    
    const netYearChangePercent = yearStartValue > 0 ? ((yearEndValue - yearStartValue) / yearStartValue) * 100 : 0;
    
    return {
      totalTradingDays,
      positiveDays,
      negativeDays,
      flatDays,
      bestDay: bestDay.date ? bestDay : null,
      worstDay: worstDay.date ? worstDay : null,
      netYearChangePercent
    };
  };

  const getHeatmapColorClass = (ret: number | undefined, isTradingDay: boolean) => {
    if (!isTradingDay || ret === undefined) {
      return "bg-slate-950/40 border border-slate-900/50";
    }
    
    const pct = ret * 100;
    
    if (pct > 1.5) return "bg-emerald-500 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.3)]";
    if (pct > 0.5) return "bg-emerald-500/60 hover:scale-125 transition-transform cursor-pointer";
    if (pct > 0.05) return "bg-emerald-500/20 hover:scale-125 transition-transform cursor-pointer border border-emerald-500/10";
    if (pct < -1.5) return "bg-rose-600 hover:scale-125 transition-transform cursor-pointer shadow-[0_0_8px_rgba(225,29,72,0.3)]";
    if (pct < -0.5) return "bg-rose-500/60 hover:scale-125 transition-transform cursor-pointer";
    if (pct < -0.05) return "bg-rose-500/20 hover:scale-125 transition-transform cursor-pointer border border-rose-500/10";
    
    return "bg-slate-800 hover:scale-125 transition-transform cursor-pointer border border-slate-700/60";
  };

  const getHeatmapDataMap = () => {
    if (!backtestResult) return new Map();
    const map = new Map();
    backtestResult.dates.forEach((dateStr: string, idx: number) => {
      const pVal = backtestResult.portfolioValues[idx];
      const prevVal = idx > 0 ? backtestResult.portfolioValues[idx - 1] : pVal;
      const dailyReturn = idx > 0 && prevVal > 0 ? (pVal - prevVal) / prevVal : 0;
      map.set(dateStr, {
        date: dateStr,
        portfolioVal: pVal,
        dailyReturn,
        cumulativeReturn: backtestResult.portfolioReturns[idx]
      });
    });
    return map;
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#0F172A]" : "bg-slate-50"} text-slate-100 font-sans selection:bg-blue-900 selection:text-white antialiased`} id="main-container">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-800 bg-slate-900/50" id="main-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">S</div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2" id="header-title">
                SectorFlow <span className="text-slate-400 font-normal">ETF Portfolio Backtester</span>
              </h1>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Backtest and optimize a custom 3-ETF sector investment strategy with Dollar Cost Averaging (DCA).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Calculation Engine: Node.js</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-slate-300">Data Source: Yahoo Finance</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 font-semibold rounded-full border border-blue-500/20">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              Live Sandbox
            </span>

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 rounded font-semibold transition-colors cursor-pointer select-none"
              id="theme-toggle-btn"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sleek Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* DOCK / WORKSPACE */}
      <main className="max-w-7xl mx-auto px-6 py-8" id="workspace">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: PARAMETER SELECTION PANEL (5 COLS) */}
          <div className="lg:col-span-5 space-y-6" id="parameters-panel">
            
            {/* STRATEGY PRESETS & PROFILES CARD */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/40" id="strategy-presets-card">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-slate-800 text-blue-400 rounded-lg">
                    <Bookmark className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-2">
                      Strategy Presets
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {BUILT_IN_PRESETS.length + savedPresets.length} available
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSavingPreset(!isSavingPreset);
                    if (!isSavingPreset) {
                      setNewPresetName(`${selectedEtfs.join("-")} ${dcaStrategy === 'value_averaging' ? 'Dynamic' : 'Fixed'} DCA`);
                    }
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isSavingPreset
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500/80 shadow-blue-900/20"
                  }`}
                  id="btn-save-current-preset"
                  title="Save current tickers, weights and DCA params as a preset in localStorage"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isSavingPreset ? "Cancel" : "Save Preset"}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Quickly toggle between investment philosophies or save your tailored allocations to <span className="font-semibold text-slate-300">localStorage</span>.
              </p>

              {/* Feedback Alert */}
              {presetFeedback && (
                <div className="mb-3.5 p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-center justify-between gap-2 transition-all animate-fadeIn" id="preset-feedback-alert">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {presetFeedback}
                  </span>
                  <button onClick={() => setPresetFeedback(null)} className="text-slate-400 hover:text-white p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* SAVE PRESET DIALOG / ACCORDION */}
              {isSavingPreset && (
                <div className="mb-4 p-4 rounded-xl bg-slate-950/70 border border-blue-500/40 shadow-inner space-y-3" id="save-preset-form">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5 text-blue-400" />
                      Save Current Configuration as Preset
                    </span>
                    <button
                      onClick={() => setIsSavingPreset(false)}
                      className="text-slate-400 hover:text-slate-200 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Preset Name
                    </label>
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="e.g. Aggressive Tech DCA"
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      id="input-preset-name"
                      autoFocus
                    />
                  </div>

                  {/* Settings Snapshot Preview */}
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-300">
                    <span className="font-semibold text-slate-200 block text-[10px] uppercase tracking-wider text-slate-400">
                      Settings Snapshot:
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <div>
                        <span className="text-slate-500">Tickers:</span>{" "}
                        <span className="font-mono font-bold text-blue-400">{selectedEtfs.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Weights:</span>{" "}
                        <span className="font-mono text-slate-200">{selectedEtfs.map(t => `${weights[t] || 33}%`).join("/")}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">DCA:</span>{" "}
                        <span className="font-mono text-slate-200">{dcaMonths} mo (${monthlyContribution}/mo)</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Strategy:</span>{" "}
                        <span className="font-mono text-slate-200">{dcaStrategy === 'value_averaging' ? 'Dynamic' : 'Fixed'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Initial:</span>{" "}
                        <span className="font-mono text-slate-200">${initialInvestment.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Rebalance:</span>{" "}
                        <span className="font-mono text-slate-200">{rebalanceAnnually ? 'Annual' : 'Drift'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSavingPreset(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-850 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
                      id="btn-confirm-save-preset"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save to LocalStorage
                    </button>
                  </div>
                </div>
              )}

              {/* PRESETS LIST / QUICK TOGGLE */}
              <div className="space-y-2.5" id="presets-list">
                
                {/* Built-in Presets Header */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-0.5">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-slate-500" />
                    Curated Strategies
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">1-Click Toggle</span>
                </div>

                <div className="grid grid-cols-1 gap-2" id="builtin-presets-grid">
                  {BUILT_IN_PRESETS.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between ${
                          isActive
                            ? "bg-blue-950/30 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.12)] text-white"
                            : "bg-slate-950/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-850/50 text-slate-300"
                        }`}
                        id={`btn-preset-${preset.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                              {isActive ? (
                                <BookmarkCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 shrink-0" />
                              )}
                              {preset.name}
                            </span>
                            {preset.tag && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                                isActive
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-slate-800 text-slate-400 border-slate-700/60"
                              }`}>
                                {preset.tag}
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                          {preset.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/60 pt-1.5 mt-0.5">
                          <div className="flex items-center gap-1 text-slate-200">
                            {preset.selectedEtfs.map((t) => (
                              <span key={t} className="bg-slate-900/90 px-1 py-0.2 rounded border border-slate-800 text-[9px]">
                                <b className="text-blue-400">{t}</b> {preset.weights[t]}%
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                            <span>{preset.dcaMonths}m DCA</span>
                            <span>•</span>
                            <span className={preset.rebalanceAnnually ? "text-emerald-400" : "text-amber-400"}>
                              {preset.rebalanceAnnually ? "Rebal" : "Drift"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Saved Presets Section */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-0.5 mb-2">
                    <span className="flex items-center gap-1">
                      <FolderPlus className="w-3 h-3 text-slate-500" />
                      My Saved Presets ({savedPresets.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Stored in localStorage</span>
                  </div>

                  {savedPresets.length === 0 ? (
                    <div className="p-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/20 text-center text-[11px] text-slate-500">
                      No custom presets saved yet. Customize your ETF tickers, weights, and DCA params, then click <b className="text-slate-400 font-semibold">"Save Preset"</b> above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2" id="custom-presets-grid">
                      {savedPresets.map((preset) => {
                        const isActive = activePresetId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleApplyPreset(preset)}
                            className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between ${
                              isActive
                                ? "bg-blue-950/30 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.12)] text-white"
                                : "bg-slate-950/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-850/50 text-slate-300"
                            }`}
                            id={`btn-preset-${preset.id}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                                  {isActive ? (
                                    <BookmarkCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  ) : (
                                    <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 shrink-0" />
                                  )}
                                  {preset.name}
                                </span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border bg-purple-500/10 text-purple-300 border-purple-500/20">
                                  Custom
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isActive && (
                                  <span className="text-[10px] font-bold text-blue-400 flex items-center gap-0.5 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                                    <Check className="w-3 h-3" />
                                    Active
                                  </span>
                                )}
                                <button
                                  onClick={(e) => handleDeletePreset(preset.id, e)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Delete preset from localStorage"
                                  id={`btn-delete-preset-${preset.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                              {preset.description || `Created ${preset.createdAt || 'recently'}`}
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/60 pt-1.5 mt-0.5">
                              <div className="flex items-center gap-1 text-slate-200">
                                {preset.selectedEtfs.map((t) => (
                                  <span key={t} className="bg-slate-900/90 px-1 py-0.2 rounded border border-slate-800 text-[9px]">
                                    <b className="text-blue-400">{t}</b> {preset.weights[t]}%
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                                <span>{preset.dcaMonths}m DCA</span>
                                <span>•</span>
                                <span className={preset.rebalanceAnnually ? "text-emerald-400" : "text-amber-400"}>
                                  {preset.rebalanceAnnually ? "Rebal" : "Drift"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 1: SECTOR ETF SELECTOR */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/40" id="etf-selector-card">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-slate-800 text-blue-400 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </span>
                  <h3 className="font-semibold text-slate-100 text-sm tracking-tight">
                    1. Select Sector ETFs
                  </h3>
                </div>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full font-medium text-slate-300 border border-slate-700">
                  Select Exactly 3
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Choose exactly three SPDR sector index funds to include in your strategic portfolio. You currently have <span className="font-semibold text-blue-400">{selectedEtfs.length}</span> selected.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="etf-grid">
                {SECTOR_ETFS.map(etf => {
                  const isChecked = selectedEtfs.includes(etf.ticker);
                  return (
                    <button
                      key={etf.ticker}
                      onClick={() => handleToggleEtf(etf.ticker)}
                      className={`flex flex-col text-left p-3.5 rounded-lg border text-xs transition-all relative ${
                        isChecked
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-750"
                      }`}
                      id={`btn-etf-${etf.ticker}`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold tracking-wider text-sm">{etf.ticker}</span>
                        <span className={`w-2 h-2 rounded-full ${isChecked ? "bg-white" : "bg-slate-600"}`}></span>
                      </div>
                      <span className={`font-semibold mb-1 block truncate ${isChecked ? "text-white" : "text-slate-200"}`}>
                        {etf.name}
                      </span>
                      <span className={`line-clamp-2 text-[10px] leading-tight ${isChecked ? "text-blue-100" : "text-slate-400"}`}>
                        {etf.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD 2: WEIGHT BALANCE & FEES */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/40" id="weights-fees-card">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-slate-800 text-blue-400 rounded-lg">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <h3 className="font-semibold text-slate-100 text-sm tracking-tight">
                    2. Weights & Expense Fees
                  </h3>
                </div>
                {selectedEtfs.length === 3 && (
                  <button
                    onClick={() => rebalanceEqual(selectedEtfs)}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium flex items-center gap-1"
                    id="btn-rebalance"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Equal
                  </button>
                )}
              </div>

              {selectedEtfs.length !== 3 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400" id="weights-warning">
                  Please select exactly 3 sector ETFs above to configure allocation weights and annual expense fees.
                </div>
              ) : (
                <div className="space-y-6" id="weights-fields">
                  {selectedEtfs.map((ticker, idx) => {
                    const weightVal = weights[ticker] || 0;
                    const feeVal = fees[ticker] || 0.0009;
                    const etfMeta = SECTOR_ETFS.find(e => e.ticker === ticker);
                    
                    return (
                      <div key={ticker} className="space-y-2 border-b border-slate-800 last:border-0 last:pb-0 pb-4" id={`cfg-block-${ticker}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">
                            {ticker} - {etfMeta?.name}
                          </span>
                          <span className="font-mono text-blue-400 font-semibold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                            Allocation: {weightVal}%
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={weightVal}
                            onChange={(e) => handleWeightChange(ticker, parseInt(e.target.value) || 0)}
                            className="flex-1 accent-blue-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                            id={`slider-${ticker}`}
                          />
                        </div>

                        {/* Fee select */}
                        <div className="pt-1">
                          <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                            Annual Expense Ratio (Fee)
                          </label>
                          <select
                            value={feeVal}
                            onChange={(e) => handleFeeChange(ticker, parseFloat(e.target.value))}
                            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-200"
                            id={`select-fee-${ticker}`}
                          >
                            {FEE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Validate Weights Total */}
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-400 font-medium">Total Allocations:</span>
                    <span className={`font-mono font-bold ${
                      Math.abs(selectedEtfs.reduce((sum, t) => sum + (weights[t] || 0), 0) - 100) < 0.1
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}>
                      {selectedEtfs.reduce((sum, t) => sum + (weights[t] || 0), 0)}% / 100%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 3: BACKTEST STRATEGY PARAMS */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/40" id="strategy-params-card">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <span className="p-1 bg-slate-800 text-blue-400 rounded-lg">
                  <Coins className="w-4 h-4" />
                </span>
                <h3 className="font-semibold text-slate-100 text-sm tracking-tight">
                  3. Strategy & Dates
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4" id="params-form">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    Initial Investment
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(Math.max(100, parseInt(e.target.value) || 0))}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                    id="input-initial-inv"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                    Monthly Contribution
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    disabled={dcaMonths === 0}
                    value={dcaMonths === 0 ? 0 : monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium ${
                      dcaMonths === 0 ? "bg-slate-950 text-slate-500 cursor-not-allowed border-slate-800" : "text-slate-100"
                    }`}
                    id="input-monthly-contrib"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    DCA Period
                  </label>
                  <select
                    value={dcaMonths}
                    onChange={(e) => setDcaMonths(parseInt(e.target.value))}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                    id="select-dca-months"
                  >
                    {DCA_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Start Backtest Date
                  </label>
                  <select
                    value={startDateOption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDateOption(val);
                      if (val !== "custom") {
                        setStartDate(val);
                      }
                    }}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                    id="select-start-date"
                  >
                    {START_DATE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {startDateOption === "custom" && (
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Specify Custom Date
                    </label>
                    <input
                      type="date"
                      min="1980-01-01"
                      max={maxDate}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                      id="input-start-date"
                    />
                  </div>
                )}

                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                    Comparison Benchmark
                  </label>
                  <select
                    value={comparisonBenchmark}
                    onChange={(e) => setComparisonBenchmark(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                    id="select-comparison-benchmark"
                  >
                    <option value="QQQ">QQQ (Invesco QQQ - Nasdaq 100)</option>
                    <option value="SPY">SPY (SPDR S&P 500 ETF)</option>
                    <option value="IWM">IWM (iShares Russell 2000)</option>
                    <option value="GLD">GLD (SPDR Gold Shares)</option>
                    <option value="AGG">AGG (iShares Core U.S. Aggregate Bond)</option>
                    <option value="EEM">EEM (iShares MSCI Emerging Markets)</option>
                  </select>
                </div>

                {dcaMonths > 0 && (
                  <div className="col-span-2 mt-2 pt-3 border-t border-slate-800/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 px-3.5 py-3 rounded-lg border border-slate-800">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">DCA Accumulation Rule</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Determine if purchases are static or scale dynamically based on valuations.</p>
                      </div>
                      <select
                        value={dcaStrategy}
                        onChange={(e) => setDcaStrategy(e.target.value)}
                        className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100 self-start sm:self-center"
                        id="select-dca-strategy"
                      >
                        <option value="fixed">Fixed DCA (Constant Amount)</option>
                        <option value="dynamic">Dynamic DCA (Rules-Based Tiers)</option>
                      </select>
                    </div>

                    {dcaStrategy === "dynamic" && (
                      <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-3.5 rounded-lg border border-slate-800/40 animate-fadeIn">
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            Reference Anchor Price
                          </label>
                          <select
                            value={dcaRefType}
                            onChange={(e) => setDcaRefType(e.target.value)}
                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                            id="select-dca-ref-type"
                          >
                            <option value="portfolio">Portfolio Value (Dynamic Basket)</option>
                            <option value="benchmark">Benchmark Price (Selected ETF)</option>
                          </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-slate-500" />
                            Reference Moving Average
                          </label>
                          <select
                            value={dcaMaPeriod}
                            onChange={(e) => setDcaMaPeriod(parseInt(e.target.value))}
                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-100"
                            id="select-dca-ma-period"
                          >
                            <option value={50}>50-Day SMA (Fast Reaction)</option>
                            <option value={100}>100-Day SMA (Balanced)</option>
                            <option value={200}>200-Day SMA (Smooth Long-Term)</option>
                          </select>
                        </div>

                        <div className="col-span-2 mt-1">
                          <div className="bg-blue-950/20 border border-blue-900/30 rounded px-2.5 py-2 text-[10px] text-blue-300">
                            <span className="font-semibold block mb-0.5">⚖️ Dynamic Multiplier Tiers (Rules-Based):</span>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 font-mono text-[9px] mt-1 text-slate-300">
                              <div className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/40">Ratio ≥ 1.10: <b className="text-rose-400">0.5x</b></div>
                              <div className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/40">Ratio ≥ 1.03: <b className="text-orange-400">0.75x</b></div>
                              <div className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/40">Ratio ≥ 0.97: <b className="text-emerald-400">1.0x</b></div>
                              <div className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/40">Ratio ≥ 0.90: <b className="text-cyan-400">1.5x</b></div>
                              <div className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/40">Ratio &lt; 0.90: <b className="text-blue-400">2.0x</b></div>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-1.5 italic">
                              Uninvested funds during high valuations are stored in a secure cash buffer and deployed automatically in deeper market drawdowns.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Annual Portfolio Rebalancing Checkbox */}
                <div className="col-span-2 mt-2 pt-3 border-t border-slate-800/60" id="annual-rebalance-setting">
                  <label
                    htmlFor="checkbox-annual-rebalance"
                    className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                      rebalanceAnnually
                        ? "bg-blue-950/20 border-blue-600/40 hover:border-blue-500/60"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="checkbox-annual-rebalance"
                      checked={rebalanceAnnually}
                      onChange={(e) => setRebalanceAnnually(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/50 cursor-pointer accent-blue-600 shrink-0"
                    />
                    <div className="space-y-1 flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                          <RefreshCw className={`w-3.5 h-3.5 ${rebalanceAnnually ? "text-blue-400" : "text-slate-500"}`} />
                          Annual Automatic Rebalancing
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rebalanceAnnually
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {rebalanceAnnually ? "Enabled (Annual Reset)" : "Disabled (Buy & Hold Drift)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {rebalanceAnnually
                          ? `Resets ETF weights back to initial targets (${selectedEtfs.map(t => `${t} ${weights[t] || 33}%`).join(", ")}) on the first trading day of each year to lock in gains and control risk.`
                          : "Portfolio weights drift based on asset growth. DCA contributions still follow target allocations, but existing shares are never sold or reallocated."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-4 text-center">
                <button
                  onClick={handleRunBacktest}
                  disabled={loading || selectedEtfs.length !== 3}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-sm"
                  id="btn-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Computing Engine Results...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Execute Portfolio Backtest
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active Sync: Backtest runs automatically when settings change.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ANALYTICAL DASHBOARD & WORKPLACE (7 COLS) */}
          <div className="lg:col-span-7 space-y-6" id="dashboard-panel">
            
            {error && (
              <div className="bg-rose-950/40 border border-rose-900 rounded-xl p-4 text-xs text-rose-200 flex items-start gap-2" id="alert-error">
                <span className="font-bold text-rose-400">Error:</span>
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              /* LOADING SKELETON */
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center space-y-6 shadow-sm" id="loading-skeleton">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <div>
                    <h3 className="font-semibold text-slate-100 text-lg tracking-tight">Running Backtest Engine</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Aligning business dates, fetching historical SPDR pricing, deducting daily expense drag, and compiling final CAGR profiles.
                    </p>
                  </div>
                </div>
              </div>
            ) : backtestResult ? (
              /* MAIN OUTPUT WORKSPACE */
              <div className="space-y-6" id="backtest-results-view">
                
                {/* 4 CORE HIGHLIGHT METRICS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="metrics-grid">
                  
                  {/* Balance */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm shadow-slate-950/20 text-left" id="metric-balance">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                      Final Balance
                    </span>
                    <span className="text-lg md:text-xl font-bold text-white block tracking-tight font-mono">
                      ${backtestResult.summary.finalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        backtestResult.summary.totalReturnPercent >= 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {backtestResult.summary.totalReturnPercent >= 0 ? "+" : ""}
                        {backtestResult.summary.totalReturnPercent.toFixed(2)}%
                      </span>
                      {backtestResult.summary.rebalancingImpact !== undefined && (
                        <span className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          backtestResult.summary.rebalancingImpact >= 0
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`} title={`Rebalance net impact on final balance: ${backtestResult.summary.rebalancingImpact >= 0 ? '+' : ''}$${backtestResult.summary.rebalancingImpact.toFixed(2)}`}>
                          Rebal: {backtestResult.summary.rebalancingImpact >= 0 ? "+" : ""}${backtestResult.summary.rebalancingImpact.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm shadow-slate-950/20 text-left" id="metric-profit">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                      Net Profit
                    </span>
                    <span className="text-lg md:text-xl font-bold text-white block tracking-tight font-mono">
                      ${backtestResult.summary.netProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Invested: ${backtestResult.summary.totalInvestment.toLocaleString()}
                    </span>
                  </div>

                  {/* CAGR */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm shadow-slate-950/20 text-left" id="metric-cagr">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                      CAGR (Ann.)
                    </span>
                    <span className="text-lg md:text-xl font-bold text-white block tracking-tight font-mono">
                      {backtestResult.summary.annualizedReturnPercent.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Compounded Annual
                    </span>
                  </div>

                  {/* Max Drawdown */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm shadow-slate-950/20 text-left" id="metric-drawdown">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                      Max Drawdown
                    </span>
                    <span className="text-lg md:text-xl font-bold text-rose-400 block tracking-tight font-mono">
                      -{backtestResult.summary.maxDrawdownPercent.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Peak-to-Trough Peak
                    </span>
                  </div>

                </div>

                {/* ANNUAL REBALANCING IMPACT SECTION */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/20 text-left" id="rebalancing-impact-section">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg border ${
                        rebalanceAnnually
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white leading-tight">Annual Portfolio Rebalancing Impact</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rebalanceAnnually
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}>
                            {rebalanceAnnually ? "Active (Annual Reset)" : "Disabled (Unmanaged Drift)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Evaluates how resetting asset weights at the start of each year compares to a buy-and-hold drifting portfolio.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setRebalanceAnnually(!rebalanceAnnually)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm cursor-pointer"
                      id="btn-toggle-rebalance-mode"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      {rebalanceAnnually ? "Switch to Buy & Hold (Drift)" : "Switch to Annual Rebalancing"}
                    </button>
                  </div>

                  {/* Rebalancing Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="rebalancing-comparison-cards">
                    
                    {/* Card 1: Active Final Balance */}
                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/80 flex flex-col justify-between" id="card-active-balance">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Active Strategy Balance
                        </span>
                        <span className="text-xl font-bold font-mono text-white tracking-tight block">
                          ${backtestResult.summary.finalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-2 border-t border-slate-900 pt-1.5">
                        {rebalanceAnnually ? "With Annual Rebalancing" : "Buy & Hold (No Rebalancing)"}
                      </span>
                    </div>

                    {/* Card 2: Counterfactual (Alternate) Final Balance */}
                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/80 flex flex-col justify-between" id="card-alternate-balance">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          {rebalanceAnnually ? "Unrebalanced (Drift) Balance" : "Rebalanced (Reset) Balance"}
                        </span>
                        <span className="text-xl font-bold font-mono text-slate-300 tracking-tight block">
                          ${(rebalanceAnnually ? backtestResult.summary.unrebalancedFinalValue : backtestResult.summary.rebalancedFinalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-2 border-t border-slate-900 pt-1.5">
                        {rebalanceAnnually ? "If weights had drifted without reset" : "If rebalanced annually at year-start"}
                      </span>
                    </div>

                    {/* Card 3: Net Impact of Rebalancing on Final Balance */}
                    {(() => {
                      const impact = backtestResult.summary.rebalancingImpact ?? 0;
                      const impactPct = backtestResult.summary.rebalancingImpactPercent ?? 0;
                      const isPositive = impact >= 0;
                      
                      return (
                        <div className={`p-4 rounded-lg border flex flex-col justify-between ${
                          isPositive 
                            ? "bg-emerald-950/20 border-emerald-500/30" 
                            : "bg-rose-950/20 border-rose-500/30"
                        }`} id="rebalancing-net-impact-card">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Net Rebalancing Impact
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                isPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                              }`}>
                                {isPositive ? "Rebalance Bonus" : "Momentum Drag"}
                              </span>
                            </div>
                            <span className={`text-xl font-bold font-mono tracking-tight block ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {isPositive ? "+" : ""}${impact.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-xs font-semibold font-mono block mt-0.5 ${
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {isPositive ? "+" : ""}{impactPct.toFixed(2)}% on Final Balance
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-2 border-t border-slate-800/60 pt-1.5">
                            {backtestResult.summary.rebalanceCount || 0} annual reset event{(backtestResult.summary.rebalanceCount || 0) === 1 ? "" : "s"} executed
                          </span>
                        </div>
                      );
                    })()}

                  </div>

                  {/* Tradeoff Explanation Narrative */}
                  <div className="mt-4 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-[11px] text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-200 block mb-1">💡 Quantitative Insight on Rebalancing vs Drift:</span>
                    {backtestResult.summary.rebalancingImpact >= 0 ? (
                      <>
                        Annual rebalancing delivered a <b className="text-emerald-400 font-semibold">rebalancing bonus of +${backtestResult.summary.rebalancingImpact.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{backtestResult.summary.rebalancingImpactPercent.toFixed(2)}%)</b>. By periodically trimming sectors that ran ahead and reallocating into cyclically depressed sectors, the portfolio systematically captured mean reversion ("volatility harvesting") without attempting market timing.
                      </>
                    ) : (
                      <>
                        An unmanaged buy-and-hold portfolio produced <b className="text-amber-400 font-semibold">+${Math.abs(backtestResult.summary.rebalancingImpact).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{Math.abs(backtestResult.summary.rebalancingImpactPercent).toFixed(2)}%) more capital</b> than annual rebalancing. This occurs when an outperforming sector exhibits strong persistent momentum (e.g., mega-cap tech expansion) that continued to appreciate faster than other sectors after being trimmed.
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/20 text-left" id="risk-metrics-section">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">Risk-Adjusted Performance & Market Exposure</h3>
                        <p className="text-[11px] text-slate-400">Calculated relative to S&P 500 (SPY) as the market benchmark proxy using a 2.0% risk-free rate.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    {/* Sharpe Ratio */}
                    <div className="p-4 bg-slate-950/45 rounded-lg border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col justify-between" id="risk-metric-sharpe">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sharpe Ratio</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/40">
                            Risk-adjusted
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4">
                          Measures excess return per unit of total risk (standard deviation). Higher means more return for the volatility taken.
                        </p>
                      </div>
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                          <span className="text-xs text-slate-300 font-semibold">Selected Portfolio</span>
                          <span className="text-base font-bold text-blue-400 font-mono">
                            {backtestResult.summary.portfolioSharpe.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">S&P 500 (SPY)</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {backtestResult.summary.benchmarkSharpe.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sortino Ratio */}
                    <div className="p-4 bg-slate-950/45 rounded-lg border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col justify-between" id="risk-metric-sortino">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sortino Ratio</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/40">
                            Downside-risk
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4">
                          Similar to Sharpe, but only penalizes negative volatility (downside deviation). Focuses purely on bad risk.
                        </p>
                      </div>
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                          <span className="text-xs text-slate-300 font-semibold">Selected Portfolio</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            {backtestResult.summary.portfolioSortino.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">S&P 500 (SPY)</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {backtestResult.summary.benchmarkSortino.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Beta */}
                    <div className="p-4 bg-slate-950/45 rounded-lg border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col justify-between" id="risk-metric-beta">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Beta (&beta;)</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/40">
                            Market Sensitivity
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4">
                          Measures volatility relative to the broader market. Beta &gt; 1.0 means more sensitive than market; Beta &lt; 1.0 means less sensitive.
                        </p>
                      </div>
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                          <span className="text-xs text-slate-300 font-semibold">Selected Portfolio</span>
                          <span className="text-base font-bold text-purple-400 font-mono">
                            {backtestResult.summary.portfolioBeta.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">S&P 500 (SPY)</span>
                          <span className="text-xs text-slate-400 font-mono">
                            1.00
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC DCA DIAGNOSTIC SECTION */}
                {dcaStrategy === "dynamic" && dcaMonths > 0 && (
                  (() => {
                    const history = backtestResult.multiplierHistory || [];
                    const cashHistory = backtestResult.cashBufferHistory || [];
                    
                    let overvalued = 0;
                    let neutral = 0;
                    let undervalued = 0;
                    
                    history.forEach((m: number) => {
                      if (m === 0.5 || m === 0.75) overvalued++;
                      else if (m === 1.0) neutral++;
                      else if (m === 1.5 || m === 2.0) undervalued++;
                    });
                    
                    const total = history.length || 1;
                    const finalCash = cashHistory[cashHistory.length - 1] || 0;
                    const peakCash = cashHistory.length > 0 ? Math.max(...cashHistory) : 0;
                    
                    return (
                      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm shadow-slate-950/20 text-left animate-fadeIn" id="dca-diagnostic-section">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                            <Coins className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white leading-tight">Rules-Based Dynamic DCA Diagnostic</h3>
                            <p className="text-[11px] text-slate-400">Analysis of the mathematical purchase tiers, cash buffer efficiency, and valuation frequencies.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                          <div className="bg-slate-950/45 p-4 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                              Final Cash Buffer
                            </span>
                            <span className="text-lg font-bold text-emerald-400 font-mono">
                              ${finalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1.5">
                              Uninvested reserves stored
                            </span>
                          </div>

                          <div className="bg-slate-950/45 p-4 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                              Peak Cash Buffer
                            </span>
                            <span className="text-lg font-bold text-white font-mono">
                              ${peakCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1.5">
                              Max buffer size during peaks
                            </span>
                          </div>

                          <div className="bg-slate-950/45 p-4 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                              Market Stance Split
                            </span>
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="h-2.5 rounded bg-rose-500/80" style={{ width: `${(overvalued/total)*100}%` }} title={`Overvalued: ${((overvalued/total)*100).toFixed(1)}%`} />
                              <div className="h-2.5 rounded bg-emerald-500/80" style={{ width: `${(neutral/total)*100}%` }} title={`Neutral: ${((neutral/total)*100).toFixed(1)}%`} />
                              <div className="h-2.5 rounded bg-blue-500/80" style={{ width: `${(undervalued/total)*100}%` }} title={`Undervalued: ${((undervalued/total)*100).toFixed(1)}%`} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-2">
                              <span className="text-rose-400">High: {((overvalued/total)*100).toFixed(0)}%</span>
                              <span className="text-emerald-400">Neutral: {((neutral/total)*100).toFixed(0)}%</span>
                              <span className="text-blue-400">Low: {((undervalued/total)*100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 bg-slate-950/30 border border-slate-800/60 rounded-lg p-3 text-[11px] text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-200 block mb-1">💡 Financial Engineering Insight:</span>
                          During periods of market euphoria (valuation ratio &gt; 1.03), the algorithm scaled back purchase size to <b className="text-rose-400">0.5x–0.75x</b> of the monthly budget. The surplus cash was held in a cash reserve and deployed at up to <b className="text-blue-400">2.0x</b> purchasing power when valuations became deeply depressed (ratio &lt; 0.90), maximizing accumulation of cheap units without lookahead bias.
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* VISUALIZER DOCK CARD */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden" id="viz-dock-card">
                  
                  {/* Tabs Navigation */}
                  <div className="flex border-b border-slate-800 bg-slate-950/45 text-xs font-semibold" id="tab-nav">
                    
                    <button
                      onClick={() => setActiveTab("charts")}
                      className={`flex items-center gap-1.5 px-4 py-3 border-r border-slate-800 ${
                        activeTab === "charts"
                          ? "bg-slate-900 text-white border-b-2 border-b-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                      id="tab-btn-charts"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Cumulative Returns
                    </button>

                    <button
                      onClick={() => setActiveTab("table")}
                      className={`flex items-center gap-1.5 px-4 py-3 border-r border-slate-800 ${
                        activeTab === "table"
                          ? "bg-slate-900 text-white border-b-2 border-b-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                      id="tab-btn-table"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Daily Values Log
                    </button>

                    <button
                      onClick={() => setActiveTab("heatmap")}
                      className={`flex items-center gap-1.5 px-4 py-3 border-r border-slate-800 ${
                        activeTab === "heatmap"
                          ? "bg-slate-900 text-white border-b-2 border-b-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                      id="tab-btn-heatmap"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Returns Heatmap
                    </button>

                    <button
                      onClick={() => setActiveTab("correlation")}
                      className={`flex items-center gap-1.5 px-4 py-3 border-r border-slate-800 ${
                        activeTab === "correlation"
                          ? "bg-slate-900 text-white border-b-2 border-b-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                      id="tab-btn-correlation"
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      Correlation Matrix
                    </button>

                    <button
                      onClick={() => setActiveTab("python")}
                      className={`flex items-center gap-1.5 px-4 py-3 border-r border-slate-800 ${
                        activeTab === "python"
                          ? "bg-slate-900 text-white border-b-2 border-b-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                      id="tab-btn-python"
                    >
                      <Code className="w-3.5 h-3.5" />
                      Python Colab Script
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("ai");
                        if (!aiAnalysis && !aiLoading) {
                          handleGenerateAiAnalysis();
                        }
                      }}
                      className={`flex items-center gap-1.5 px-4 py-3 border-r border-slate-800 ${
                        activeTab === "ai"
                          ? "bg-slate-900 text-white border-b-2 border-b-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                      id="tab-btn-ai"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 fill-blue-500/10" />
                      Gemini AI Deep Analysis
                    </button>

                  </div>

                  {/* TAB CONTENTS */}
                  <div className="p-6" id="tab-content-area">
                    
                    {/* TAB 1: CHART VISUALIZATION */}
                    {activeTab === "charts" && (
                      <div className="space-y-6" id="charts-pane">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            Date Range: <span className="font-semibold text-slate-200">{backtestResult.dates[0]}</span> to <span className="font-semibold text-slate-200">{backtestResult.dates[backtestResult.dates.length - 1]}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            Click Legend Toggles to Show/Hide Component Lines
                          </span>
                        </div>

                        {/* Interactive toggle legend badge array */}
                        <div className="flex flex-wrap gap-2 mb-2" id="toggle-legend">
                          
                          <button
                            onClick={() => toggleLine("Portfolio")}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                              visibleLines.Portfolio
                                ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                                : "bg-slate-950 border-slate-800 text-slate-500 line-through"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                            Combined Portfolio (
                            {backtestResult.summary.totalReturnPercent >= 0 ? "+" : ""}
                            {backtestResult.summary.totalReturnPercent.toFixed(1)}%)
                          </button>

                          {selectedEtfs.map((ticker, idx) => {
                            const colors = ["#2563EB", "#D97706", "#DB2777"]; // blue, amber, pink
                            const color = colors[idx % colors.length];
                            const standaloneReturn = backtestResult.summary.componentTotalReturns[ticker] || 0;
                            const isVisible = visibleLines[ticker];
                            
                            return (
                              <button
                                key={ticker}
                                onClick={() => toggleLine(ticker)}
                                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                                  isVisible
                                    ? "bg-slate-800 border-slate-700 text-slate-200"
                                    : "bg-slate-950 border-slate-850 text-slate-600 line-through"
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isVisible ? color : "#475569" }}></span>
                                {ticker} Standalone (
                                {standaloneReturn >= 0 ? "+" : ""}
                                {standaloneReturn.toFixed(1)}%)
                              </button>
                            );
                          })}

                          {backtestResult.benchmarkTicker && (
                            <button
                              onClick={() => toggleLine(backtestResult.benchmarkTicker)}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                                visibleLines[backtestResult.benchmarkTicker]
                                  ? "bg-purple-600/20 border-purple-500/50 text-purple-400"
                                  : "bg-slate-950 border-slate-850 text-slate-600 line-through"
                              }`}
                            >
                              <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
                              Benchmark {backtestResult.benchmarkTicker} (
                              {backtestResult.summary.benchmarkTotalReturnPercent >= 0 ? "+" : ""}
                              {backtestResult.summary.benchmarkTotalReturnPercent?.toFixed(1)}%)
                            </button>
                          )}

                          {rebalanceAnnually ? (
                            <button
                              onClick={() => toggleLine("Unrebalanced")}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                visibleLines.Unrebalanced
                                  ? "bg-slate-700/60 border-slate-500 text-slate-200"
                                  : "bg-slate-950 border-slate-850 text-slate-600 line-through"
                              }`}
                              id="toggle-btn-unrebalanced"
                              title="Compare against buy-and-hold portfolio with no rebalancing"
                            >
                              <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed"></span>
                              Unrebalanced Drift ({backtestResult.summary.rebalancingImpact >= 0 ? "-" : "+"}{Math.abs(backtestResult.summary.rebalancingImpactPercent).toFixed(1)}% vs active)
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleLine("Rebalanced")}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                visibleLines.Rebalanced
                                  ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400"
                                  : "bg-slate-950 border-slate-850 text-slate-600 line-through"
                              }`}
                              id="toggle-btn-rebalanced"
                              title="Compare against annually rebalanced portfolio"
                            >
                              <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed"></span>
                              Annual Rebalanced ({backtestResult.summary.rebalancingImpact >= 0 ? "+" : "-"}{Math.abs(backtestResult.summary.rebalancingImpactPercent).toFixed(1)}% vs active)
                            </button>
                          )}

                        </div>

                        <div className="h-[320px] w-full" id="chart-canvas-container">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getChartData()} syncId="stressSync" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#1E293B" : "#E2E8F0"} />
                              <XAxis
                                dataKey="date"
                                tickLine={false}
                                stroke="#64748B"
                                fontSize={10}
                                tickFormatter={(str) => {
                                  // Show year/month only to avoid crowding
                                  if (!str) return "";
                                  const pts = str.split("-");
                                  return `${pts[0]}/${pts[1]}`;
                                }}
                              />
                              <YAxis
                                stroke="#64748B"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `${val}%`}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: theme === "dark" ? "#0F172A" : "#FFFFFF",
                                  border: theme === "dark" ? "1px solid #1E293B" : "1px solid #E2E8F0",
                                  borderRadius: "8px",
                                  boxShadow: theme === "dark" ? "0 4px 12px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.08)",
                                  color: theme === "dark" ? "#F1F5F9" : "#0F172A"
                                }}
                                labelStyle={{ fontWeight: "600", color: theme === "dark" ? "#F1F5F9" : "#0F172A", fontSize: "11px", marginBottom: "4px" }}
                                itemStyle={{ fontSize: "11px", color: theme === "dark" ? "#94A3B8" : "#475569" }}
                                formatter={(value: number) => [`${value}%`]}
                              />
                              <Line
                                name="Combined Portfolio"
                                type="monotone"
                                dataKey="Portfolio"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 5 }}
                              />
                              {visibleLines[selectedEtfs[0]] && (
                                <Line
                                  name={`${selectedEtfs[0]} Standalone`}
                                  type="monotone"
                                  dataKey={selectedEtfs[0]}
                                  stroke="#2563EB"
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                              )}
                              {visibleLines[selectedEtfs[1]] && (
                                <Line
                                  name={`${selectedEtfs[1]} Standalone`}
                                  type="monotone"
                                  dataKey={selectedEtfs[1]}
                                  stroke="#D97706"
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                              )}
                              {visibleLines[selectedEtfs[2]] && (
                                <Line
                                  name={`${selectedEtfs[2]} Standalone`}
                                  type="monotone"
                                  dataKey={selectedEtfs[2]}
                                  stroke="#DB2777"
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                              )}
                              {backtestResult.benchmarkTicker && visibleLines[backtestResult.benchmarkTicker] && (
                                <Line
                                  name={`Benchmark ${backtestResult.benchmarkTicker}`}
                                  type="monotone"
                                  dataKey={backtestResult.benchmarkTicker}
                                  stroke="#a855f7"
                                  strokeWidth={2}
                                  strokeDasharray="5 3"
                                  dot={false}
                                />
                              )}
                              {visibleLines.Unrebalanced && (
                                <Line
                                  name="Unrebalanced (Drift)"
                                  type="monotone"
                                  dataKey="Unrebalanced"
                                  stroke="#94a3b8"
                                  strokeWidth={2}
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                              )}
                              {visibleLines.Rebalanced && (
                                <Line
                                  name="Annual Rebalanced"
                                  type="monotone"
                                  dataKey="Rebalanced"
                                  stroke="#10b981"
                                  strokeWidth={2}
                                  strokeDasharray="4 4"
                                  dot={false}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* STRESS INDICATOR CONTROL & CHART PANEL */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/45 p-4 rounded-xl border border-slate-800/80 mt-2">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-orange-400" />
                              Market Stress & Volatility Indicator
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              View rolling mathematical stress indicators synchronized with your backtest timeline.
                            </p>
                          </div>
                          
                          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                            <button
                              onClick={() => setStressIndicator("volatility")}
                              className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all ${
                                stressIndicator === "volatility"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Volatility Index (20D)
                            </button>
                            <button
                              onClick={() => setStressIndicator("atr")}
                              className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all ${
                                stressIndicator === "atr"
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Average True Range (14D)
                            </button>
                            <button
                              onClick={() => setStressIndicator("none")}
                              className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all ${
                                stressIndicator === "none"
                                  ? "bg-slate-800 text-slate-300"
                                  : "text-slate-500 hover:text-slate-400"
                              }`}
                            >
                              Hide
                            </button>
                          </div>
                        </div>

                        {stressIndicator !== "none" && (
                          <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-4 rounded-xl animate-fadeIn">
                            <div className="h-[140px] w-full" id="stress-chart-container">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getChartData()} syncId="stressSync" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="volatilityGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="atrGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#1E293B" : "#E2E8F0"} />
                                  <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    stroke="#64748B"
                                    fontSize={10}
                                    tickFormatter={(str) => {
                                      if (!str) return "";
                                      const pts = str.split("-");
                                      return `${pts[0]}/${pts[1]}`;
                                    }}
                                  />
                                  <YAxis
                                    stroke="#64748B"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => stressIndicator === "volatility" ? `${val}%` : `${val}`}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: theme === "dark" ? "#0F172A" : "#FFFFFF",
                                      border: theme === "dark" ? "1px solid #1E293B" : "1px solid #E2E8F0",
                                      borderRadius: "8px",
                                      boxShadow: theme === "dark" ? "0 4px 12px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.08)",
                                      color: theme === "dark" ? "#F1F5F9" : "#0F172A"
                                    }}
                                    labelStyle={{ fontWeight: "600", color: theme === "dark" ? "#F1F5F9" : "#0F172A", fontSize: "11px", marginBottom: "4px" }}
                                    itemStyle={{ fontSize: "11px" }}
                                    formatter={(value: number) => [
                                      stressIndicator === "volatility" 
                                        ? `${value}% Annualized` 
                                        : `${value} Index Points`,
                                      stressIndicator === "volatility" ? "Rolling Volatility" : "ATR"
                                    ]}
                                  />
                                  <Area
                                    name={stressIndicator === "volatility" ? "Volatility" : "Average True Range"}
                                    type="monotone"
                                    dataKey={stressIndicator === "volatility" ? "volatility" : "atr"}
                                    stroke={stressIndicator === "volatility" ? "#f97316" : "#06b6d4"}
                                    strokeWidth={2}
                                    fill={stressIndicator === "volatility" ? "url(#volatilityGrad)" : "url(#atrGrad)"}
                                    dot={false}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2 border-t border-slate-800/40 pt-3 text-left">
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                  Current Stress Context
                                </span>
                                <p className="text-slate-300 text-[11px] leading-relaxed">
                                  {stressIndicator === "volatility" ? (
                                    <>
                                      The <b>Volatility Index</b> measures the rolling 20-day annualized standard deviation of daily returns.
                                      Spikes above <b>25%</b> typically indicate high-stress regime periods (e.g., bear markets, correction periods),
                                      while values below <b>15%</b> indicate a stable bull-market environment.
                                    </>
                                  ) : (
                                    <>
                                      The <b>Average True Range (ATR)</b> index measures the rolling 14-day average of absolute index moves.
                                      An expanding ATR indicates expanding daily ranges, highlighting high asset dispersion and market panic,
                                      while a shrinking ATR implies narrow, quiet consolidation ranges.
                                    </>
                                  )}
                                </p>
                              </div>

                              {(() => {
                                const history = stressIndicator === "volatility" 
                                  ? (backtestResult.volatilityHistory || []) 
                                  : (backtestResult.atrHistory || []);
                                const threshold = stressIndicator === "volatility" ? 22 : 1.5;
                                
                                const stressDays: { date: string, val: number }[] = [];
                                history.forEach((v: number, idx: number) => {
                                  if (v > threshold) {
                                    stressDays.push({ date: backtestResult.dates[idx], val: v });
                                  }
                                });

                                const distinctMonths = new Set<string>();
                                const distinctStressDays: typeof stressDays[] = [];
                                stressDays
                                  .sort((a, b) => b.val - a.val)
                                  .forEach(d => {
                                    const m = d.date.substring(0, 7);
                                    if (!distinctMonths.has(m) && distinctStressDays.length < 3) {
                                      distinctMonths.add(m);
                                      distinctStressDays.push(d as any);
                                    }
                                  });

                                return (
                                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 flex flex-col justify-between">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        Peak Stress Regimes Identified
                                      </span>
                                      {distinctStressDays.length === 0 ? (
                                        <span className="text-slate-400 text-[11px] italic">
                                          No high-stress regimes exceeded thresholds over this backtest period.
                                        </span>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {distinctStressDays.map((d: any, i) => (
                                            <div key={i} className="flex justify-between items-center text-[10px] font-mono text-slate-300">
                                              <span className="font-semibold text-slate-200">
                                                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                              </span>
                                              <span className={`${stressIndicator === "volatility" ? "text-orange-400" : "text-cyan-400"} font-bold`}>
                                                {stressIndicator === "volatility" ? `${d.val.toFixed(1)}% Vol` : `${d.val.toFixed(1)} ATR`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-400 block mt-2 leading-tight">
                                      Dynamic DCA leverages these stress periods by scaling up purchasing size (up to 2.0x) exactly when panic peaks.
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Drag and Compound Impact Card */}
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-5" id="impact-breakdown">
                          <h4 className="font-semibold text-slate-200 text-sm mb-3">
                            Strategy Compound Drag & Rebalancing Breakdown
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 block mb-1">Total Fee Expense Drag</span>
                              <span className="font-bold text-slate-100 font-mono text-sm">
                                ${backtestResult.summary.totalFeesPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">Deducted fractionally daily from ETF valuations.</p>
                            </div>

                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 block mb-1">DCA Investment Capital</span>
                              <span className="font-bold text-slate-100 font-mono text-sm">
                                ${backtestResult.summary.totalContributions.toLocaleString()}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">Contributions spread over first {dcaMonths} months.</p>
                            </div>

                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 block mb-1">Average Expense Fee</span>
                              <span className="font-bold text-slate-100 font-mono text-sm">
                                {(selectedEtfs.reduce((sum, t) => sum + (fees[t] || 0), 0) / 3 * 100).toFixed(2)}%
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">Combined annual average portfolio expense drag.</p>
                            </div>

                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 block mb-1">Annual Rebalance Net Impact</span>
                              <span className={`font-bold font-mono text-sm ${
                                (backtestResult.summary.rebalancingImpact ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {(backtestResult.summary.rebalancingImpact ?? 0) >= 0 ? "+" : ""}${backtestResult.summary.rebalancingImpact?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {(backtestResult.summary.rebalancingImpactPercent ?? 0) >= 0 ? "+" : ""}{(backtestResult.summary.rebalancingImpactPercent ?? 0).toFixed(2)}% vs unmanaged drift.
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB 2: HISTORICAL TABLE LOG */}
                    {activeTab === "table" && (
                      <div className="space-y-4" id="table-pane">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-400">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>
                              Showing {paginatedTableRows.length} business dates of {totalTableRows} total entries.
                            </span>
                            <span className="text-slate-700 hidden sm:inline">•</span>
                            <span>Sorted: Latest first</span>
                          </div>
                          
                          <button
                            onClick={handleExportCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition-all shadow-sm shrink-0 text-xs self-start sm:self-auto"
                            id="btn-export-csv"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export results as CSV
                          </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950" id="table-scroll">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-950 border-b border-slate-850 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                                <th className="p-3">Date</th>
                                <th className="p-3">Portfolio Balance</th>
                                <th className="p-3">Cum. Return</th>
                                <th className="p-3">Capital Invested</th>
                                <th className="p-3">{selectedEtfs[0]} Value</th>
                                <th className="p-3">{selectedEtfs[1]} Value</th>
                                <th className="p-3">{selectedEtfs[2]} Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedTableRows.map((row: any, idx: number) => (
                                <tr key={idx} className="border-b border-slate-850/50 hover:bg-slate-800/20 text-slate-300">
                                  <td className="p-3 font-mono text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                      <span>{row.date}</span>
                                      {row.isRebalanced && backtestResult.summary.rebalanceAnnually && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold inline-flex items-center gap-0.5" title="Portfolio assets rebalanced back to target allocations">
                                          <RefreshCw className="w-2.5 h-2.5" /> Rebal
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono text-slate-200 font-semibold">${row.portfolioVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className={`p-3 font-mono font-bold ${row.portfolioRet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {row.portfolioRet >= 0 ? "+" : ""}
                                    {row.portfolioRet.toFixed(2)}%
                                  </td>
                                  <td className="p-3 font-mono text-slate-500">${row.contributed.toLocaleString()}</td>
                                  <td className="p-3 font-mono text-slate-400">${row.t0Val.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                                  <td className="p-3 font-mono text-slate-400">${row.t1Val.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                                  <td className="p-3 font-mono text-slate-400">${row.t2Val.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Table pagination UI */}
                        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs" id="table-pagination">
                          <button
                            onClick={() => setTablePage(Math.max(1, tablePage - 1))}
                            disabled={tablePage === 1}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed font-medium transition-all"
                          >
                            Previous
                          </button>
                          <span className="text-slate-400 font-medium">
                            Page <span className="text-white font-semibold">{tablePage}</span> of <span className="text-white font-semibold">{totalPages}</span>
                          </span>
                          <button
                            onClick={() => setTablePage(Math.min(totalPages, tablePage + 1))}
                            disabled={tablePage === totalPages}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed font-medium transition-all"
                          >
                            Next
                          </button>
                        </div>

                      </div>
                    )}

                    {/* TAB: RETURNS HEATMAP */}
                    {activeTab === "heatmap" && (
                      <div className="space-y-6" id="heatmap-pane">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <h4 className="font-semibold text-slate-200 text-sm">
                              Daily Returns Heatmap
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1">
                              A calendar-based visualization of daily portfolio performance. Positive days are shaded in green, while negative days are shaded in rose.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <label htmlFor="heatmap-year-select" className="text-xs text-slate-400 font-medium">Select Year:</label>
                            <select
                              id="heatmap-year-select"
                              value={heatmapYear || ""}
                              onChange={(e) => {
                                setHeatmapYear(Number(e.target.value));
                                setHoveredDay(null);
                              }}
                              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                              {getAvailableYears().map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Heatmap Section */}
                        {heatmapYear && (() => {
                          const days = getDaysInYear(heatmapYear);
                          const dataMap = getHeatmapDataMap();
                          const jan1 = new Date(heatmapYear, 0, 1);
                          const startDayOfWeek = jan1.getDay();
                          
                          // Group days by week columns
                          const columns: any[][] = [];
                          days.forEach((day, idx) => {
                            const colIdx = Math.floor((idx + startDayOfWeek) / 7);
                            if (!columns[colIdx]) {
                              columns[colIdx] = [];
                            }
                            columns[colIdx].push(day);
                          });

                          // Find month boundaries for headers
                          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                          const monthLabels: { label: string; colIdx: number }[] = [];
                          let currentMonth = -1;
                          columns.forEach((col, colIdx) => {
                            // Find if there is a day in this column that represents a new month
                            const firstDay = col.find(d => d);
                            if (firstDay && firstDay.month !== currentMonth) {
                              if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== monthNames[firstDay.month]) {
                                monthLabels.push({ label: monthNames[firstDay.month], colIdx });
                                currentMonth = firstDay.month;
                              }
                            }
                          });

                          return (
                            <div className="space-y-6">
                              {/* Scrollable Heatmap Wrapper */}
                              <div className="bg-slate-950 border border-slate-850 rounded-xl p-5" id="heatmap-wrapper">
                                <div className="overflow-x-auto select-none pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                  <div className="min-w-[700px] flex flex-col">
                                    
                                    {/* Month Labels row */}
                                    <div className="flex text-[10px] text-slate-500 font-medium h-4 relative ml-8 mb-1">
                                      {monthLabels.map((lbl, idx) => (
                                        <span
                                          key={idx}
                                          className="absolute"
                                          style={{ left: `${lbl.colIdx * 13}px` }}
                                        >
                                          {lbl.label}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Heatmap body */}
                                    <div className="flex">
                                      {/* Day of Week Labels Column */}
                                      <div className="flex flex-col text-[9px] text-slate-500 font-semibold justify-between h-[91px] pr-2 w-6 text-right select-none leading-none pt-[1px]">
                                        <span>Sun</span>
                                        <span>Mon</span>
                                        <span>Tue</span>
                                        <span>Wed</span>
                                        <span>Thu</span>
                                        <span>Fri</span>
                                        <span>Sat</span>
                                      </div>

                                      {/* Columns Grid */}
                                      <div className="flex gap-[2px]">
                                        {columns.map((col, colIdx) => (
                                          <div key={colIdx} className="flex flex-col gap-[2px] w-[11px]">
                                            {Array.from({ length: 7 }).map((_, rIdx) => {
                                              const day = col.find(d => d.dayOfWeek === rIdx);
                                              if (!day) {
                                                return (
                                                  <div
                                                    key={rIdx}
                                                    className="w-[11px] h-[11px] rounded-[2px] bg-transparent"
                                                  />
                                                );
                                              }

                                              const dayData = dataMap.get(day.dateStr);
                                              const isTradingDay = !!dayData;
                                              const colorClass = getHeatmapColorClass(dayData?.dailyReturn, isTradingDay);
                                              
                                              // Format title for native browser tooltip
                                              const tooltipTitle = isTradingDay
                                                ? `${day.dateStr}: ${(dayData.dailyReturn * 100).toFixed(2)}% (Balance: $${dayData.portfolioVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                                                : `${day.dateStr} (Non-trading / Weekend)`;

                                              return (
                                                <div
                                                  key={rIdx}
                                                  className={`w-[11px] h-[11px] rounded-[2px] ${colorClass}`}
                                                  title={tooltipTitle}
                                                  onMouseEnter={() => {
                                                    if (isTradingDay) {
                                                      setHoveredDay({
                                                        ...dayData,
                                                        dayOfWeek: day.dayOfWeek,
                                                        dayOfMonth: day.dayOfMonth,
                                                        month: day.month
                                                      });
                                                    } else {
                                                      setHoveredDay({
                                                        date: day.dateStr,
                                                        isNonTrading: true
                                                      });
                                                    }
                                                  }}
                                                />
                                              );
                                            })}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                  </div>
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-900/60 text-[10px] text-slate-500">
                                  <span className="font-medium text-slate-400">
                                    Tip: Hover over squares to inspect daily metrics.
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span>Loss</span>
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.3)]" title="< -1.5%" />
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-rose-500/60" title="-0.5% to -1.5%" />
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-rose-500/20" title="-0.05% to -0.5%" />
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800" title="Neutral" />
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/20" title="+0.05% to +0.5%" />
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/60" title="+0.5% to +1.5%" />
                                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" title="> +1.5%" />
                                    <span>Gain</span>
                                  </div>
                                </div>
                              </div>

                              {/* Active Detail / Year Analysis Section */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="heatmap-analysis-grid">
                                
                                {/* Live Cell Diagnostics Card */}
                                <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 md:col-span-1" id="hover-diagnostics">
                                  <h5 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-3">
                                    Diagnostics Panel
                                  </h5>

                                  {hoveredDay ? (
                                    hoveredDay.isNonTrading ? (
                                      <div className="space-y-2 py-2">
                                        <span className="font-mono text-xs text-slate-400 block font-semibold">{hoveredDay.date}</span>
                                        <span className="text-slate-500 text-xs font-semibold block">Market Closed</span>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                          No trading or pricing operations occurred on weekends or exchange holidays.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <div>
                                          <span className="font-mono text-sm text-slate-200 block font-bold">{hoveredDay.date}</span>
                                          <span className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 block">
                                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][hoveredDay.dayOfWeek]} • Trading Day
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                          <div>
                                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Daily Return</span>
                                            <span className={`text-base font-bold font-mono tracking-tight block mt-0.5 ${
                                              hoveredDay.dailyReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                              {hoveredDay.dailyReturn >= 0 ? "+" : ""}
                                              {(hoveredDay.dailyReturn * 100).toFixed(2)}%
                                            </span>
                                          </div>

                                          <div>
                                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Portfolio Value</span>
                                            <span className="text-base font-bold font-mono tracking-tight text-white block mt-0.5">
                                              ${hoveredDay.portfolioVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                          </div>

                                          <div className="col-span-2 border-t border-slate-900 pt-3">
                                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Cumulative Strategy Return</span>
                                            <span className={`text-sm font-bold font-mono tracking-tight block mt-0.5 ${
                                              hoveredDay.cumulativeReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                              {hoveredDay.cumulativeReturn >= 0 ? "+" : ""}
                                              {(hoveredDay.cumulativeReturn * 100).toFixed(2)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div className="py-8 text-center text-slate-500 space-y-2">
                                      <Calendar className="w-8 h-8 text-slate-700 mx-auto" />
                                      <p className="text-xs leading-normal max-w-[200px] mx-auto">
                                        Hover over any calendar square to load real-time analytics.
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Selected Year Overall Analytics */}
                                {(() => {
                                  const metrics = getYearlyMetrics(heatmapYear);
                                  if (!metrics) return null;

                                  return (
                                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 md:col-span-2" id="year-overall-stats">
                                      <h5 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-3">
                                        {heatmapYear} Yearly Summary Statistics
                                      </h5>

                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-1">
                                        
                                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900/60">
                                          <span className="text-slate-500 block mb-1">Year Net Return</span>
                                          <span className={`font-bold font-mono text-base ${
                                            metrics.netYearChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                                          }`}>
                                            {metrics.netYearChangePercent >= 0 ? "+" : ""}
                                            {metrics.netYearChangePercent.toFixed(2)}%
                                          </span>
                                          <p className="text-[10px] text-slate-500 mt-1">Change in portfolio value during {heatmapYear}.</p>
                                        </div>

                                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900/60">
                                          <span className="text-slate-500 block mb-1">Trading Days</span>
                                          <span className="font-bold text-slate-200 font-mono text-base">
                                            {metrics.totalTradingDays} days
                                          </span>
                                          <p className="text-[10px] text-slate-500 mt-1">
                                            <span className="text-emerald-500">{metrics.positiveDays} up</span> / <span className="text-rose-500">{metrics.negativeDays} down</span>
                                          </p>
                                        </div>

                                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900/60">
                                          <span className="text-slate-500 block mb-1">Positive Ratio</span>
                                          <span className="font-bold text-emerald-400 font-mono text-base">
                                            {((metrics.positiveDays / metrics.totalTradingDays) * 100).toFixed(1)}%
                                          </span>
                                          <p className="text-[10px] text-slate-500 mt-1">Percentage of up trading sessions.</p>
                                        </div>

                                        {metrics.bestDay && (
                                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900/60 col-span-1 sm:col-span-1">
                                            <span className="text-slate-500 block mb-1">Best Trading Day</span>
                                            <span className="font-bold text-emerald-400 font-mono text-sm block">
                                              +{(metrics.bestDay.return * 100).toFixed(2)}%
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                              {metrics.bestDay.date}
                                            </span>
                                          </div>
                                        )}

                                        {metrics.worstDay && (
                                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900/60 col-span-1 sm:col-span-1">
                                            <span className="text-slate-500 block mb-1">Worst Trading Day</span>
                                            <span className="font-bold text-rose-400 font-mono text-sm block">
                                              {(metrics.worstDay.return * 100).toFixed(2)}%
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                              {metrics.worstDay.date}
                                            </span>
                                          </div>
                                        )}

                                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900/60 col-span-2 sm:col-span-1 flex flex-col justify-center">
                                          <span className="text-slate-500 block mb-0.5">Performance Type</span>
                                          <span className={`font-bold uppercase tracking-wide text-xs block ${
                                            metrics.netYearChangePercent >= 15
                                              ? "text-emerald-400"
                                              : metrics.netYearChangePercent >= 5
                                              ? "text-blue-400"
                                              : metrics.netYearChangePercent >= -5
                                              ? "text-slate-300"
                                              : "text-rose-400"
                                          }`}>
                                            {metrics.netYearChangePercent >= 15
                                              ? "🚀 Strong Bull"
                                              : metrics.netYearChangePercent >= 5
                                              ? "📈 Moderate Bull"
                                              : metrics.netYearChangePercent >= -5
                                              ? "⚖️ Flat / Consolidation"
                                              : "📉 Bear Market"}
                                          </span>
                                        </div>

                                      </div>
                                    </div>
                                  );
                                })()}

                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* TAB: CORRELATION MATRIX */}
                    {activeTab === "correlation" && (
                      <div className="space-y-6" id="correlation-pane">
                        <div className="border-b border-slate-800 pb-4 text-left">
                          <h4 className="font-semibold text-slate-200 text-sm">
                            Historical Asset Correlation Matrix
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            This matrix displays the Pearson correlation coefficient calculated from daily returns over the selected backtest range (<strong>{backtestResult.dates[0]}</strong> to <strong>{backtestResult.dates[backtestResult.dates.length - 1]}</strong>). Use this to measure sector integration and optimize diversification.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="correlation-main-grid">
                          {/* Heatmap Matrix Card */}
                          <div className="lg:col-span-6 bg-slate-950 border border-slate-850 rounded-xl p-6 flex flex-col items-center justify-center min-h-[360px]" id="correlation-heatmap-matrix">
                            <span className="text-[10px] uppercase font-bold text-slate-500 mb-6 tracking-wider select-none text-center block">
                              Pearson Correlation Matrix (3x3 Grid)
                            </span>
                            
                            {/* Matrix container */}
                            <div className="w-full max-w-[320px] select-none" id="correlation-matrix-grid">
                              {/* Headers row */}
                              <div className="grid grid-cols-4 gap-2 mb-2 text-center text-[10px] font-bold text-slate-400">
                                <div className="text-left font-normal text-slate-500 self-end">ETF</div>
                                {selectedEtfs.map(ticker => (
                                  <div key={ticker} className="py-1 font-mono">{ticker}</div>
                                ))}
                              </div>

                              {/* Matrix body rows */}
                              {selectedEtfs.map(t1 => (
                                <div key={t1} className="grid grid-cols-4 gap-2 mb-2 items-center text-center">
                                  {/* Row Header */}
                                  <div className="text-left font-mono font-bold text-xs text-slate-300">
                                    {t1}
                                  </div>

                                  {/* Row Cells */}
                                  {selectedEtfs.map(t2 => {
                                    const val = backtestResult?.correlationMatrix?.[t1]?.[t2] ?? (t1 === t2 ? 1 : 0);
                                    const style = getCorrelationColor(val, theme);
                                    const isHovered = hoveredCorrCell?.t1 === t1 && hoveredCorrCell?.t2 === t2;

                                    return (
                                      <div
                                        key={t2}
                                        onMouseEnter={() => setHoveredCorrCell({ t1, t2, val })}
                                        onMouseLeave={() => setHoveredCorrCell(null)}
                                        className={`h-16 rounded-lg border flex flex-col justify-center items-center cursor-help transition-all duration-200 font-mono ${style.bg} ${style.glow} ${
                                          isHovered ? "ring-2 ring-blue-500/80 scale-[1.04]" : ""
                                        }`}
                                      >
                                        <span className="text-xs font-extrabold">{val.toFixed(2)}</span>
                                        <span className="text-[8px] text-slate-500 mt-1 uppercase font-semibold select-none">
                                          {t1 === t2 ? "Self" : "Pair"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>

                            {/* Legend scale */}
                            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-900/60 w-full max-w-[320px] text-[9px] text-slate-500 font-semibold select-none">
                              <span className="text-rose-400">Uncorrelated / Neg</span>
                              <div className="flex gap-1">
                                <div className="w-3 h-3 rounded bg-slate-900 border border-slate-800" title="Neutral" />
                                <div className="w-3 h-3 rounded bg-blue-600/10 border border-blue-600/10" title="Low Correlation (0.0 to 0.3)" />
                                <div className="w-3 h-3 rounded bg-blue-600/20 border border-blue-600/20" title="Moderate Correlation (0.3 to 0.6)" />
                                <div className="w-3 h-3 rounded bg-blue-600/30 border border-blue-500/40" title="High Correlation (0.6 to 1.0)" />
                              </div>
                              <span className="text-blue-400">Highly Correlated</span>
                            </div>
                          </div>

                          {/* Diagnostics & Analyst Panel */}
                          <div className="lg:col-span-6 bg-slate-950 border border-slate-850 rounded-xl p-5 min-h-[360px] flex flex-col justify-between text-left" id="correlation-analyst-panel">
                            <div>
                              <h5 className="font-semibold text-slate-300 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                Asset Pair Correlation Analyst
                              </h5>

                              {hoveredCorrCell ? (
                                <div className="space-y-4 animate-fadeIn" id="corr-analyst-hovered">
                                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                                    <div>
                                      <span className="font-mono text-sm text-slate-100 font-bold block">
                                        {hoveredCorrCell.t1} & {hoveredCorrCell.t2}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 block">
                                        Asset Relationship Diagnostic
                                      </span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${getCorrelationColor(hoveredCorrCell.val, theme).badge}`}>
                                      r = {hoveredCorrCell.val.toFixed(4)}
                                    </span>
                                  </div>

                                  <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Relationship Nature</span>
                                      <p className="text-slate-300 text-[11px] leading-relaxed">
                                        {hoveredCorrCell.t1 === hoveredCorrCell.t2 ? (
                                          <>
                                            <strong>Self-correlation</strong> is always <strong>1.00</strong>. An asset is perfectly correlated with itself as they share the exact same daily return and volatility profile.
                                          </>
                                        ) : hoveredCorrCell.val >= 0.75 ? (
                                          <>
                                            <strong>Very Strong Positive Correlation</strong>. These sectors are highly integrated and usually react synchronously to broad market forces. This reduces the structural diversification benefits of holding both sectors simultaneously, as they will likely suffer drawdowns at the same time.
                                          </>
                                        ) : hoveredCorrCell.val >= 0.50 ? (
                                          <>
                                            <strong>Moderate-to-Strong Positive Correlation</strong>. These sectors share standard macro growth drivers but maintain significant idiosyncratic industry factors. They offer a moderate degree of variance reduction and smooth out overall portfolio volatility reasonably well.
                                          </>
                                        ) : hoveredCorrCell.val >= 0.20 ? (
                                          <>
                                            <strong>Low-to-Moderate Positive Correlation</strong>. Excellent pair for multi-asset diversification! They operate on distinct sector business cycles. Combining them can provide strong risk reduction and higher Sharpe/Sortino performance.
                                          </>
                                        ) : hoveredCorrCell.val >= -0.10 ? (
                                          <>
                                            <strong>Near-Zero / No Correlation</strong>. Outstanding diversification synergy! Their movements are statistically decoupled. Declines or gains in one asset have virtually no bearing on the performance of the other, allowing for consistent risk smoothing.
                                          </>
                                        ) : (
                                          <>
                                            <strong>Negative Correlation</strong>. Superior defensive alignment! When one asset experiences market panic, the other tends to appreciate. This creates powerful risk-offset structures, dampening overall portfolio drawdowns significantly.
                                          </>
                                        )}
                                      </p>
                                    </div>

                                    {hoveredCorrCell.t1 !== hoveredCorrCell.t2 && (
                                      <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">DCA Optimization Impact</span>
                                        <p className="text-[11px] text-slate-400 leading-normal">
                                          {hoveredCorrCell.val >= 0.70 ? (
                                            "Since these assets have high common exposure, rebalancing is critical. When valuations decouple briefly, the Dynamic DCA strategy uses valuation ratios to buy the underpriced asset heavier, capturing arbitrage value."
                                          ) : (
                                            "Low correlation boosts the compound impact of rebalancing. When sector returns diverge, annual rebalancing locks in profits from the outperforming asset and buys the underperforming asset at a massive relative discount."
                                          )}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="py-10 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl" id="corr-analyst-default">
                                  <Grid3X3 className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
                                  <p className="text-xs leading-normal max-w-[240px] mx-auto font-medium">
                                    Hover over any matrix block to inspect the interactive Pearson correlation diagnostic report.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Static overall correlation summary report */}
                            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60 mt-4 text-xs text-left text-slate-300">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                                Portfolio Diversification Score
                              </span>
                              {(() => {
                                const matrix = backtestResult?.correlationMatrix || {};
                                const t = selectedEtfs;
                                if (!matrix[t[0]] || !matrix[t[1]] || !matrix[t[2]]) {
                                  return <span>Calculating portfolio integration...</span>;
                                }
                                const c1 = matrix[t[0]][t[1]] ?? 0;
                                const c2 = matrix[t[0]][t[2]] ?? 0;
                                const c3 = matrix[t[1]][t[2]] ?? 0;
                                const avgCorr = (c1 + c2 + c3) / 3;

                                let scoreLabel = "High Integration (Low Diversification)";
                                let color = "text-orange-400 font-bold";
                                if (avgCorr < 0.35) {
                                  scoreLabel = "Excellent Diversification (Decoupled)";
                                  color = "text-emerald-400 font-bold";
                                } else if (avgCorr < 0.65) {
                                  scoreLabel = "Optimal Diversification (Balanced)";
                                  color = "text-cyan-400 font-bold";
                                }

                                return (
                                  <div className="space-y-1.5" id="corr-diversification-summary">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-slate-300">Average Pair Correlation:</span>
                                      <span className="font-mono text-white font-bold">{avgCorr.toFixed(3)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] border-t border-slate-800/60 pt-1.5 mt-1">
                                      <span className="text-slate-400 font-medium">Synergy Status:</span>
                                      <span className={color}>{scoreLabel}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: PYTHON CODE GENERATION */}
                    {activeTab === "python" && (
                      <div className="space-y-4" id="python-pane">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-200 text-sm">
                              Python & Google Colab Script
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Automatically configured script utilizing <code className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">yfinance</code> and <code className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">pandas</code> for running real-life calculations directly on Google Colab or your local machine.
                            </p>
                          </div>
                          
                          <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs rounded hover:bg-slate-700 font-semibold transition-all border border-slate-700 shadow-xs"
                            id="btn-copy-code"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Code
                              </>
                            )}
                          </button>
                        </div>

                        {/* CODEBLOCK VIEWPORT */}
                        <div className="overflow-hidden border border-slate-800 rounded-lg shadow-inner bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-[380px] overflow-y-auto leading-relaxed relative" id="code-viewport">
                          <pre>{backtestResult.pythonCode}</pre>
                        </div>

                        {/* Google Colab Instructions */}
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-xs text-slate-300 flex gap-3" id="colab-instructions">
                          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-slate-200">How to execute on Google Colab:</span>
                            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                              <li>Navigate to <a href="https://colab.research.google.com" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-400 hover:text-blue-300">Google Colab</a> and click "New Notebook".</li>
                              <li>Install yfinance by running: <code className="bg-slate-900 border border-slate-800 rounded px-1.5 font-mono text-[10px] font-bold">!pip install yfinance</code> in the first cell.</li>
                              <li>Copy the above script, paste it in a new cell, and click "Run". It automatically downloads prices and generates interactive charts matching your dashboard criteria.</li>
                            </ol>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB 4: GEMINI AI REPORT */}
                    {activeTab === "ai" && (
                      <div className="space-y-4" id="ai-pane">
                        
                        {aiLoading ? (
                          <div className="py-16 text-center space-y-4" id="ai-loader">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                            <div>
                              <h4 className="font-semibold text-slate-200">Gemini Consulting System...</h4>
                              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                Analyzing diversified asset returns, calculating fee drag multipliers, and formulating strategic macroeconomic scenarios.
                              </p>
                            </div>
                          </div>
                        ) : aiAnalysis ? (
                          <div className="space-y-4 text-left" id="ai-report-body">
                            
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 fill-blue-500/10 text-blue-400" />
                                Institutional Portfolio Consultation Report
                              </span>
                              <button
                                onClick={handleGenerateAiAnalysis}
                                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-semibold hover:underline"
                                id="btn-re-analyze"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Re-Analyze
                              </button>
                            </div>

                            <div className="prose prose-invert prose-slate max-w-none prose-sm leading-relaxed" id="markdown-reader">
                              {renderMarkdown(aiAnalysis)}
                            </div>

                          </div>
                        ) : (
                          <div className="py-12 text-center space-y-4" id="ai-fallback">
                            <Sparkles className="w-8 h-8 text-blue-400 mx-auto animate-bounce" />
                            <div>
                              <h4 className="font-semibold text-slate-200">Custom Institutional Report</h4>
                              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                                Receive professional diagnostics about compounding, fees drag, and macroeconomic sector correlations for this selected combination.
                              </p>
                            </div>
                            <button
                              onClick={handleGenerateAiAnalysis}
                              className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                              id="btn-trigger-ai"
                            >
                              Generate Consultation Report
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                  </div>

                </div>

              </div>
            ) : (
              /* EMPTY DEFAULT STATE */
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center space-y-4 shadow-sm shadow-slate-950/20" id="empty-state">
                <Briefcase className="w-12 h-12 text-slate-500 mx-auto" />
                <div>
                  <h3 className="font-semibold text-slate-200 text-lg">No Active Portfolio</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Select exactly 3 sector index funds in the parameters drawer on the left and execute backtest to review compound performance charts.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/40 mt-12 py-8 text-center text-xs text-slate-500" id="main-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SectorFlow ETF Portfolio Backtester. Educational simulations only. No actual financial advice.</p>
          <div className="flex items-center gap-4 font-semibold text-slate-400">
            <a href="https://query1.finance.yahoo.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 hover:underline">Yahoo Finance Data</a>
            <a href="https://colab.research.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 hover:underline">Google Colab</a>
            <a href="https://ai.studio/build" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 hover:underline">Google AI Studio</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
