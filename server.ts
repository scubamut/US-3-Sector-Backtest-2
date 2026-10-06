import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize Gemini Client lazily and safely
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// --- DATA STRUCTS & PARAMETERS ---
const BASE_PRICES: Record<string, number> = {
  XLK: 40.0,
  XLV: 65.0,
  XLF: 22.0,
  XLY: 70.0,
  XLE: 75.0,
  XLP: 45.0,
  XLB: 45.0,
  XLRE: 30.0,
  XLI: 50.0,
  XLC: 45.0,
  SPY: 250.0,
  QQQ: 150.0,
  IWM: 100.0,
  GLD: 110.0,
  AGG: 95.0,
  EEM: 35.0
};

const DRIFTS: Record<string, number> = {
  XLK: 0.165,
  XLV: 0.105,
  XLF: 0.085,
  XLY: 0.115,
  XLE: 0.045,
  XLP: 0.075,
  XLB: 0.080,
  XLRE: 0.065,
  XLI: 0.090,
  XLC: 0.110,
  SPY: 0.095,
  QQQ: 0.120,
  IWM: 0.080,
  GLD: 0.050,
  AGG: 0.030,
  EEM: 0.060
};

const VOLATILITIES: Record<string, number> = {
  XLK: 0.20,
  XLV: 0.13,
  XLF: 0.18,
  XLY: 0.18,
  XLE: 0.28,
  XLP: 0.11,
  XLB: 0.16,
  XLRE: 0.16,
  XLI: 0.15,
  XLC: 0.19,
  SPY: 0.15,
  QQQ: 0.18,
  IWM: 0.19,
  GLD: 0.12,
  AGG: 0.06,
  EEM: 0.17
};

const ETF_NAMES: Record<string, string> = {
  XLK: "Technology Select Sector SPDR",
  XLV: "Health Care Select Sector SPDR",
  XLF: "Financial Select Sector SPDR",
  XLY: "Consumer Discretionary Select Sector SPDR",
  XLE: "Energy Select Sector SPDR",
  XLP: "Consumer Staples Select Sector SPDR",
  XLB: "Materials Select Sector SPDR",
  XLRE: "Real Estate Select Sector SPDR",
  XLI: "Industrials Select Sector SPDR",
  XLC: "Communication Services Select Sector SPDR",
  SPY: "SPDR S&P 500 ETF Trust",
  QQQ: "Invesco QQQ Trust",
  IWM: "iShares Russell 2000 ETF",
  GLD: "SPDR Gold Shares",
  AGG: "iShares Core U.S. Aggregate Bond ETF",
  EEM: "iShares MSCI Emerging Markets ETF"
};

// --- UTILITIES ---
function seedRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function seedNormal(seed1: string, seed2: string): number {
  const u1 = seedRandom(seed1) || 0.0001;
  const u2 = seedRandom(seed2);
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function generateBusinessDays(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Safety guard against infinite loops or excessive generations
  const minDate = new Date("1980-01-01");
  const maxDate = new Date();
  
  const actualStart = curr < minDate ? minDate : curr;
  const actualEnd = end > maxDate ? maxDate : end;
  
  while (actualStart <= actualEnd) {
    const day = actualStart.getDay();
    if (day !== 0 && day !== 6) { // Monday = 1, Friday = 5
      dates.push(actualStart.toISOString().split('T')[0]);
    }
    actualStart.setDate(actualStart.getDate() + 1);
  }
  return dates;
}

function generateDeterministicPrices(ticker: string, dates: string[]): { date: string, price: number }[] {
  const basePrice = BASE_PRICES[ticker] || 50.0;
  const drift = DRIFTS[ticker] || 0.10;
  const vol = VOLATILITIES[ticker] || 0.15;
  
  const dailyDrift = drift / 252;
  const dailyVol = vol / Math.sqrt(252);
  
  const epochStart = dates[0] || "1980-01-01";
  const lastDate = dates[dates.length - 1] || new Date().toISOString().split('T')[0];
  const allDays = generateBusinessDays(epochStart, lastDate);
  
  let currentPrice = basePrice;
  const dateMap = new Map<string, number>();
  
  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    const z = seedNormal(d + "_" + ticker + "_1", d + "_" + ticker + "_2");
    // Geometric Brownian Motion step
    currentPrice = currentPrice * Math.exp(dailyDrift - 0.5 * dailyVol * dailyVol + dailyVol * z);
    dateMap.set(d, currentPrice);
  }
  
  const priceSeries: { date: string, price: number }[] = [];
  for (const requestedDate of dates) {
    const price = dateMap.get(requestedDate) || currentPrice;
    priceSeries.push({ date: requestedDate, price });
  }
  
  return priceSeries;
}

async function getETFPrices(ticker: string, startDate: string, endDate: string): Promise<{ date: string, price: number }[]> {
  const requestedDates = generateBusinessDays(startDate, endDate);
  
  try {
    const startStamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endStamp = Math.floor(new Date(endDate).getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${startStamp}&period2=${endStamp}&interval=1d&events=history&includeAdjustedClose=true`;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4500); // 4.5 seconds timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`Yahoo status ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    const dataMap = new Map<string, number>();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length < 6) continue;
      const date = parts[0];
      const adjClose = parseFloat(parts[5]);
      if (!isNaN(adjClose) && date) {
        dataMap.set(date, adjClose);
      }
    }
    
    if (dataMap.size > 0) {
      const alignedSeries: { date: string, price: number }[] = [];
      let lastKnownPrice = BASE_PRICES[ticker] || 50;
      
      for (const d of requestedDates) {
        let price = dataMap.get(d);
        if (price === undefined || isNaN(price)) {
          price = lastKnownPrice;
        } else {
          lastKnownPrice = price;
        }
        if (price > 0) {
          alignedSeries.push({ date: d, price });
        }
      }
      
      if (alignedSeries.length > 5) {
        return alignedSeries;
      }
    }
    throw new Error("Invalid CSV from Yahoo.");
  } catch (err: any) {
    // Graceful deterministic simulation fallback
    return generateDeterministicPrices(ticker, requestedDates);
  }
}

// --- HISTORICAL PROXY MAPPING ---
// Maps modern ETFs to mutual funds or older ETFs that proxy them to extend historical data.
const PROXY_MAP: Record<string, string[]> = {
  WX: ["WX", "BWX", "RPIBX", "SCINX"],
  DBC: ["DBC", "QRAAX", "LEXMX"],
  DBE: ["DBE", "GSP", "USO", "MAGRX", "LEXMX"],
  EDV: ["EDV", "TLT", "VUSTX"],
  EEM: ["EEM", "VEIEX", "FEMKX"],
  EFA: ["EFA", "FDIVX"],
  EMB: ["EMB", "PREMX"],
  EPP: ["EPP", "FPBFX"],
  EWJ: ["EWJ", "FJPNX"],
  EWX: ["EWX", "DGS", "SDMGX"],
  FEZ: ["FEZ", "FIEUX"],
  GLD: ["GLD", "SCGDX"],
  IEF: ["IEF", "VFITX"],
  IEI: ["IEI", "VFITX"],
  IEV: ["IEV", "FIEUX"],
  ILF: ["ILF", "FLATX"],
  IWM: ["IWM", "NAESX"],
  IYR: ["IYR", "VGSIX", "FRESX"],
  JNK: ["JNK", "HYG", "FAHYX"],
  MDY: ["MDY", "FMCSX", "FDVLX"],
  QQQ: ["QQQ", "KTCAX"],
  TIP: ["TIP", "VIPSX"],
  RWX: ["RWX", "VNQ", "VGSIX", "FRESX"],
  SCZ: ["SCZ", "DLS", "PRIDX"],
  SHY: ["SHY", "VFISX"],
  SPY: ["SPY", "VFINX"],
  SSO: ["SSO", "MDY", "FMCSX", "FDVLX"],
  TLT: ["TLT", "VUSTX"],
  VTI: ["VTI", "VTSMX"],
  VWO: ["VWO", "EEM", "VEIEX", "FEMKX"],
  XLB: ["XLB", "FSDPX"],
  XLE: ["XLE", "VGENX"],
  XLF: ["XLF", "FIDSX"],
  XLI: ["XLI", "FSCGX"],
  XLK: ["XLK", "FSPTX"],
  XLP: ["XLP", "FDFAX"],
  XLU: ["XLU", "FSUTX"],
  XLV: ["XLV", "VGHCX"],
  XLY: ["XLY", "FSRPX"],
  XME: ["XME", "VGPMX"]
};

// Fetches ETF prices and extends them backwards recursively using the proxy chain
async function getExtendedETFPrices(ticker: string, startDate: string, endDate: string): Promise<{ date: string, price: number }[]> {
  const chain = PROXY_MAP[ticker] || [ticker];
  let combined: { date: string, price: number }[] = [];

  for (let i = 0; i < chain.length; i++) {
    const currentTicker = chain[i];
    const series = await getETFPrices(currentTicker, startDate, endDate);
    if (!series || series.length === 0) continue;

    if (combined.length === 0) {
      combined = [...series];
    } else {
      // Merge proxy series into combined
      combined.sort((a, b) => a.date.localeCompare(b.date));
      series.sort((a, b) => a.date.localeCompare(b.date));

      const firstMain = combined[0];
      // Find the element in proxy series with the same date
      let proxyMatch = series.find(x => x.date === firstMain.date);
      if (!proxyMatch && series.length > 0) {
        // Fallback to the closest date in series
        proxyMatch = series.reduce((prev, curr) => {
          return Math.abs(new Date(curr.date).getTime() - new Date(firstMain.date).getTime()) <
                 Math.abs(new Date(prev.date).getTime() - new Date(firstMain.date).getTime()) ? curr : prev;
        });
      }

      if (proxyMatch && proxyMatch.price > 0) {
        const ratio = firstMain.price / proxyMatch.price;
        const prependedPoints: { date: string, price: number }[] = [];
        
        for (const p of series) {
          if (p.date < firstMain.date) {
            prependedPoints.push({
              date: p.date,
              price: p.price * ratio
            });
          }
        }
        combined = [...prependedPoints, ...combined];
      }
    }

    // Sort to make sure we stay ordered
    combined.sort((a, b) => a.date.localeCompare(b.date));

    // If we already cover the requested start date or very close to it, we can stop
    if (combined.length > 0 && combined[0].date <= startDate) {
      break;
    }
  }

  // Fallback if empty
  if (combined.length === 0) {
    return getETFPrices(ticker, startDate, endDate);
  }

  // Finally, align combined series to the exact requested business days range
  const requestedDates = generateBusinessDays(startDate, endDate);
  const dataMap = new Map<string, number>();
  combined.forEach(p => dataMap.set(p.date, p.price));

  const alignedSeries: { date: string, price: number }[] = [];
  let lastPrice = combined[0]?.price || 50;

  for (const d of requestedDates) {
    let p = dataMap.get(d);
    if (p === undefined) {
      p = lastPrice;
    } else {
      lastPrice = p;
    }
    alignedSeries.push({ date: d, price: p });
  }

  return alignedSeries;
}

// --- BACKTEST ENGINE ---
function runBacktest(
  tickers: string[],
  weights: number[],
  priceData: Record<string, { date: string, price: number }[]>,
  dcaMonths: number,
  fees: Record<string, number>,
  initialInvestment: number,
  monthlyContribution: number,
  spyPrices: { date: string, price: number }[],
  comparisonBenchmark: string,
  dcaStrategy: string = "fixed",
  dcaMaPeriod: number = 200,
  dcaRefType: string = "portfolio",
  rebalanceAnnually: boolean = true
) {
  const dates = priceData[tickers[0]].map(x => x.date);
  const n = dates.length;
  
  const w = tickers.map((_, idx) => (weights[idx] ?? 33.33) / 100);
  
  const portfolioValues: number[] = [];
  const portfolioReturns: number[] = [];
  const cumulativeContributions: number[] = [];
  const cashBufferHistory: number[] = [];
  const multiplierHistory: number[] = [];
  
  const rebalancedValues: number[] = [];
  const unrebalancedValues: number[] = [];
  const rebalanceDates: string[] = [];

  const componentValues: Record<string, number[]> = {};
  const componentReturns: Record<string, number[]> = {};
  const sharesHeld: Record<string, number[]> = {};
  
  tickers.forEach(t => {
    componentValues[t] = [];
    componentReturns[t] = [];
    sharesHeld[t] = [];
  });
  
  const initialPrices = tickers.map(t => priceData[t][0]?.price || 50);
  
  // Track both rebalanced and unrebalanced share counts in parallel
  const rebalShares = tickers.map((_, i) => (initialInvestment * w[i]) / initialPrices[i]);
  const unrebalShares = tickers.map((_, i) => (initialInvestment * w[i]) / initialPrices[i]);
  
  let totalDcaMonthsContributed = 0;
  let totalInvested = initialInvestment;
  let totalFeesPaid = 0;
  
  // Standalone ETF portfolios start with full initialInvestment
  const standaloneShares = tickers.map((t, i) => initialInvestment / (priceData[t][0]?.price || 50));
  
  // Benchmark setup (DCA & Fees simulated for apples-to-apples comparison)
  let benchmarkShares = initialInvestment / (priceData[comparisonBenchmark]?.[0]?.price || 100);
  const benchmarkValues: number[] = [];
  const benchmarkReturns: number[] = [];
  
  let lastMonthStr = dates[0] ? dates[0].substring(0, 7) : "";
  let lastYearStr = dates[0] ? dates[0].substring(0, 4) : "";
  
  // S&P 500 Map for risk metrics
  const spyMap = new Map<string, number>();
  spyPrices.forEach(p => spyMap.set(p.date, p.price));
  let lastSpyPrice = spyPrices[0]?.price || 250;

  const pReturnsList: number[] = [];
  const bReturnsList: number[] = [];

  // Cash buffers for portfolio, benchmark, and standalones
  let cashBuffer = 0;
  let benchmarkCashBuffer = 0;
  const standaloneCashBuffers = tickers.map(() => 0);

  // Precalculate daily reference prices for the Moving Average (prevents lookahead bias)
  const refValues: number[] = [];
  for (let t = 0; t < n; t++) {
    let refPrice = 100;
    if (dcaRefType === "benchmark") {
      refPrice = priceData[comparisonBenchmark]?.[t]?.price || 100;
    } else {
      refPrice = tickers.reduce((sum, ticker, i) => {
        const w_i = (weights[i] ?? 33.33) / 100;
        return sum + w_i * (priceData[ticker]?.[t]?.price || 50);
      }, 0);
    }
    refValues.push(refPrice);
  }

  for (let t = 0; t < n; t++) {
    const dateStr = dates[t];
    const currentMonthStr = dateStr.substring(0, 7);
    const currentYearStr = dateStr.substring(0, 4);
    
    // Smooth moving average reference point fixed in advance (t-1)
    let ma = refValues[0];
    if (t > 0) {
      const startIdx = Math.max(0, t - dcaMaPeriod);
      let sum = 0;
      for (let j = startIdx; j < t; j++) {
        sum += refValues[j];
      }
      ma = sum / (t - startIdx);
    }

    const currentRefPrice = refValues[t];
    const ratio = currentRefPrice / ma;
    
    // Tiers definition
    let multiplier = 1.0;
    if (dcaStrategy === "dynamic") {
      if (ratio >= 1.10) {
        multiplier = 0.5; // Strongly Overvalued
      } else if (ratio >= 1.03) {
        multiplier = 0.75; // Overvalued
      } else if (ratio >= 0.97) {
        multiplier = 1.0; // Fair Value
      } else if (ratio >= 0.90) {
        multiplier = 1.5; // Undervalued
      } else {
        multiplier = 2.0; // Strongly Undervalued
      }
    }

    // Annual Rebalancing (including cashBuffer in the net assets calculation)
    if (t > 0 && currentYearStr !== lastYearStr) {
      let totalRebalEquity = 0;
      tickers.forEach((ticker, i) => {
        const price = priceData[ticker][t].price;
        totalRebalEquity += rebalShares[i] * price;
      });
      tickers.forEach((ticker, i) => {
        const price = priceData[ticker][t].price;
        rebalShares[i] = (totalRebalEquity * w[i]) / price;
      });
      rebalanceDates.push(dateStr);
      lastYearStr = currentYearStr;
    }
    
    const currentShares = rebalanceAnnually ? rebalShares : unrebalShares;
    
    let isDcaDay = false;
    if (dcaMonths > 0 && t > 0 && currentMonthStr !== lastMonthStr) {
      if (totalDcaMonthsContributed < dcaMonths) {
        totalDcaMonthsContributed++;
        totalInvested += monthlyContribution;
        cashBuffer += monthlyContribution;
        benchmarkCashBuffer += monthlyContribution;
        tickers.forEach((_, i) => {
          standaloneCashBuffers[i] += monthlyContribution;
        });
      }
      isDcaDay = true;
      lastMonthStr = currentMonthStr;
    }
    
    // Capture daily return before DCA purchase
    const spyPriceToday = spyMap.get(dateStr) || lastSpyPrice;
    if (t > 0) {
      let valBeforeDca = cashBuffer;
      tickers.forEach((ticker, i) => {
        const annualFee = fees[ticker] || 0;
        const dailyFeeRate = annualFee / 252;
        const priceToday = priceData[ticker][t].price;
        valBeforeDca += currentShares[i] * (1 - dailyFeeRate) * priceToday;
      });
      const pRet = portfolioValues[t - 1] > 0 ? (valBeforeDca / portfolioValues[t - 1]) - 1 : 0;
      pReturnsList.push(pRet);
      
      const bRet = lastSpyPrice > 0 ? (spyPriceToday / lastSpyPrice) - 1 : 0;
      bReturnsList.push(bRet);
    } else {
      pReturnsList.push(0);
      bReturnsList.push(0);
    }
    lastSpyPrice = spyPriceToday;

    // Deduct daily fees
    tickers.forEach((ticker, i) => {
      const annualFee = fees[ticker] || 0;
      const dailyFeeRate = annualFee / 252;
      
      const price = priceData[ticker][t].price;
      const valBeforeFee = currentShares[i] * price;
      const feeDeductedVal = valBeforeFee * dailyFeeRate;
      totalFeesPaid += feeDeductedVal;
      
      rebalShares[i] = rebalShares[i] * (1 - dailyFeeRate);
      unrebalShares[i] = unrebalShares[i] * (1 - dailyFeeRate);
      standaloneShares[i] = standaloneShares[i] * (1 - dailyFeeRate);
    });
    
    // Apply standard index fee to benchmark
    const bPrice = priceData[comparisonBenchmark]?.[t]?.price || 100;
    const bFeeRate = 0.0009 / 252; // 0.09% standard benchmark index fee
    benchmarkShares = benchmarkShares * (1 - bFeeRate);
    
    // Handle DCA purchase from buffers
    if (isDcaDay) {
      let actualPurchase = 0;
      let bActualPurchase = 0;
      const sActualPurchases = tickers.map(() => 0);

      if (dcaStrategy === "dynamic") {
        const targetPurchase = monthlyContribution * multiplier;
        actualPurchase = Math.min(cashBuffer, targetPurchase);
        cashBuffer -= actualPurchase;

        bActualPurchase = Math.min(benchmarkCashBuffer, targetPurchase);
        benchmarkCashBuffer -= bActualPurchase;

        tickers.forEach((_, i) => {
          sActualPurchases[i] = Math.min(standaloneCashBuffers[i], targetPurchase);
          standaloneCashBuffers[i] -= sActualPurchases[i];
        });
      } else {
        actualPurchase = Math.min(cashBuffer, monthlyContribution);
        cashBuffer -= actualPurchase;

        bActualPurchase = Math.min(benchmarkCashBuffer, monthlyContribution);
        benchmarkCashBuffer -= bActualPurchase;

        tickers.forEach((_, i) => {
          sActualPurchases[i] = Math.min(standaloneCashBuffers[i], monthlyContribution);
          standaloneCashBuffers[i] -= sActualPurchases[i];
        });
      }

      // Execute trades
      tickers.forEach((ticker, i) => {
        const price = priceData[ticker][t].price;
        const allocated = actualPurchase * w[i];
        rebalShares[i] += allocated / price;
        unrebalShares[i] += allocated / price;
        standaloneShares[i] += sActualPurchases[i] / price;
      });
      benchmarkShares += bActualPurchase / bPrice;
    }
    
    let totalPortfolioVal = cashBuffer;
    let totalRebalVal = cashBuffer;
    let totalUnrebalVal = cashBuffer;
    
    tickers.forEach((ticker, i) => {
      const price = priceData[ticker][t].price;
      const val = currentShares[i] * price;
      totalPortfolioVal += val;
      
      totalRebalVal += rebalShares[i] * price;
      totalUnrebalVal += unrebalShares[i] * price;
      
      componentValues[ticker].push(val + standaloneCashBuffers[i]);
      sharesHeld[ticker].push(currentShares[i]);
      
      const sVal = standaloneShares[i] * price + standaloneCashBuffers[i];
      const sReturn = (sVal / totalInvested) - 1;
      componentReturns[ticker].push(sReturn);
    });
    
    portfolioValues.push(totalPortfolioVal);
    rebalancedValues.push(totalRebalVal);
    unrebalancedValues.push(totalUnrebalVal);
    cumulativeContributions.push(totalInvested);
    
    const portReturn = (totalPortfolioVal / totalInvested) - 1;
    portfolioReturns.push(portReturn);
    
    const bVal = benchmarkShares * bPrice + benchmarkCashBuffer;
    benchmarkValues.push(bVal);
    const bReturn = (bVal / totalInvested) - 1;
    benchmarkReturns.push(bReturn);

    cashBufferHistory.push(cashBuffer);
    multiplierHistory.push(multiplier);
  }
  
  const finalValue = portfolioValues[n - 1] || initialInvestment;
  const rebalancedFinalValue = rebalancedValues[n - 1] || initialInvestment;
  const unrebalancedFinalValue = unrebalancedValues[n - 1] || initialInvestment;
  const rebalancingImpact = rebalancedFinalValue - unrebalancedFinalValue;
  const rebalancingImpactPercent = unrebalancedFinalValue > 0
    ? ((rebalancedFinalValue - unrebalancedFinalValue) / unrebalancedFinalValue) * 100
    : 0;
  const totalContributions = totalDcaMonthsContributed * monthlyContribution;
  const netProfit = finalValue - totalInvested;
  const totalReturnPercent = (finalValue / totalInvested - 1) * 100;
  
  // CAGR Calculation
  const startDateObj = new Date(dates[0] || "2020-01-01");
  const endDateObj = new Date(dates[n - 1] || "2024-01-01");
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.max(diffDays / 365.25, 0.05);
  const annualizedReturnPercent = (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100;
  
  // Max Drawdown
  let maxVal = -Infinity;
  let maxDd = 0;
  for (let i = 0; i < n; i++) {
    const val = portfolioValues[i];
    if (val > maxVal) maxVal = val;
    const dd = (maxVal - val) / maxVal;
    if (dd > maxDd) maxDd = dd;
  }
  const maxDrawdownPercent = maxDd * 100;
  
  const componentFinalShares: Record<string, number> = {};
  const componentFinalValues: Record<string, number> = {};
  const componentTotalReturns: Record<string, number> = {};
  
  const finalActiveShares = rebalanceAnnually ? rebalShares : unrebalShares;
  tickers.forEach((ticker, i) => {
    componentFinalShares[ticker] = finalActiveShares[i];
    componentFinalValues[ticker] = componentValues[ticker][n - 1] || 0;
    componentTotalReturns[ticker] = (componentReturns[ticker][n - 1] || 0) * 100;
  });
  
  // --- RISK METRICS CALCULATION ---
  const rfAnnual = 0.02; // 2% risk-free rate
  const rfDaily = rfAnnual / 252;
  
  const numReturnDays = n - 1;
  let avgPRet = 0;
  let avgBRet = 0;
  
  for (let t = 1; t < n; t++) {
    avgPRet += pReturnsList[t];
    avgBRet += bReturnsList[t];
  }
  avgPRet = numReturnDays > 0 ? avgPRet / numReturnDays : 0;
  avgBRet = numReturnDays > 0 ? avgBRet / numReturnDays : 0;
  
  let pVarSum = 0;
  let bVarSum = 0;
  for (let t = 1; t < n; t++) {
    pVarSum += Math.pow(pReturnsList[t] - avgPRet, 2);
    bVarSum += Math.pow(bReturnsList[t] - avgBRet, 2);
  }
  const pDailyStd = numReturnDays > 1 ? Math.sqrt(pVarSum / (numReturnDays - 1)) : 0;
  const bDailyStd = numReturnDays > 1 ? Math.sqrt(bVarSum / (numReturnDays - 1)) : 0;
  
  const portfolioSharpe = pDailyStd > 0 ? (Math.sqrt(252) * (avgPRet - rfDaily)) / pDailyStd : 0;
  const benchmarkSharpe = bDailyStd > 0 ? (Math.sqrt(252) * (avgBRet - rfDaily)) / bDailyStd : 0;
  
  let pDownsideSum = 0;
  let bDownsideSum = 0;
  for (let t = 1; t < n; t++) {
    const pDiff = pReturnsList[t] - rfDaily;
    if (pDiff < 0) {
      pDownsideSum += Math.pow(pDiff, 2);
    }
    const bDiff = bReturnsList[t] - rfDaily;
    if (bDiff < 0) {
      bDownsideSum += Math.pow(bDiff, 2);
    }
  }
  const pDownsideStd = numReturnDays > 1 ? Math.sqrt(pDownsideSum / (numReturnDays - 1)) : 0;
  const bDownsideStd = numReturnDays > 1 ? Math.sqrt(bDownsideSum / (numReturnDays - 1)) : 0;
  
  const portfolioSortino = pDownsideStd > 0 ? (Math.sqrt(252) * (avgPRet - rfDaily)) / pDownsideStd : 0;
  const benchmarkSortino = bDownsideStd > 0 ? (Math.sqrt(252) * (avgBRet - rfDaily)) / bDownsideStd : 0;
  
  let covNum = 0;
  let bVar = 0;
  for (let t = 1; t < n; t++) {
    covNum += (pReturnsList[t] - avgPRet) * (bReturnsList[t] - avgBRet);
    bVar += Math.pow(bReturnsList[t] - avgBRet, 2);
  }
  const portfolioBeta = bVar > 0 ? covNum / bVar : 1.0;

  const benchmarkFinalValue = benchmarkValues[n - 1] || initialInvestment;
  const benchmarkTotalReturnPercent = ((benchmarkFinalValue / totalInvested) - 1) * 100;

  // --- VOLATILITY & ATR CALCULATIONS ---
  const volatilityHistory: number[] = [];
  const atrHistory: number[] = [];
  
  // Create relative Portfolio Price Index for ATR computation: Index_t = (PortfolioValue_t / totalInvested) * 100
  const portfolioIndices = portfolioValues.map((val, idx) => {
    const invested = cumulativeContributions[idx] || initialInvestment;
    return (val / invested) * 100;
  });

  const trueRanges: number[] = [0];
  for (let t = 1; t < n; t++) {
    trueRanges.push(Math.abs(portfolioIndices[t] - portfolioIndices[t - 1]));
  }

  for (let t = 0; t < n; t++) {
    // 1. Volatility Index: 20-Day rolling annualized standard deviation of daily returns
    const volWindow = 20;
    if (t < 2) {
      volatilityHistory.push(0);
    } else {
      const startIdx = Math.max(0, t - volWindow + 1);
      const count = t - startIdx + 1;
      
      let sum = 0;
      for (let j = startIdx; j <= t; j++) {
        sum += pReturnsList[j];
      }
      const mean = sum / count;
      
      let varianceSum = 0;
      for (let j = startIdx; j <= t; j++) {
        varianceSum += Math.pow(pReturnsList[j] - mean, 2);
      }
      const dailyStd = Math.sqrt(varianceSum / Math.max(1, count - 1));
      const annualizedVol = dailyStd * Math.sqrt(252) * 100; // as percentage
      volatilityHistory.push(parseFloat(annualizedVol.toFixed(2)));
    }

    // 2. Average True Range (ATR): 14-Day rolling simple moving average of True Ranges (relative portfolio index)
    const atrWindow = 14;
    if (t < 1) {
      atrHistory.push(0);
    } else {
      const startIdx = Math.max(0, t - atrWindow + 1);
      const count = t - startIdx + 1;
      
      let sumTR = 0;
      for (let j = startIdx; j <= t; j++) {
        sumTR += trueRanges[j];
      }
      const avgTR = sumTR / count;
      atrHistory.push(parseFloat(avgTR.toFixed(2)));
    }
  }

  // --- CORRELATION MATRIX CALCULATION ---
  const etfReturns: Record<string, number[]> = {};
  tickers.forEach(ticker => {
    etfReturns[ticker] = [];
    for (let t = 1; t < n; t++) {
      const pricePrev = priceData[ticker]?.[t - 1]?.price || 0;
      const priceToday = priceData[ticker]?.[t]?.price || 0;
      const ret = pricePrev > 0 ? (priceToday - pricePrev) / pricePrev : 0;
      etfReturns[ticker].push(ret);
    }
  });

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const len = x.length;
    if (len === 0) return 0;
    
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < len; i++) {
      sumX += x[i];
      sumY += y[i];
    }
    const meanX = sumX / len;
    const meanY = sumY / len;
    
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < len; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      num += diffX * diffY;
      denX += diffX * diffX;
      denY += diffY * diffY;
    }
    
    if (denX === 0 || denY === 0) return 0;
    return num / Math.sqrt(denX * denY);
  };

  const correlationMatrix: Record<string, Record<string, number>> = {};
  tickers.forEach(t1 => {
    correlationMatrix[t1] = {};
    tickers.forEach(t2 => {
      correlationMatrix[t1][t2] = parseFloat(calculateCorrelation(etfReturns[t1], etfReturns[t2]).toFixed(4));
    });
  });

  return {
    dates,
    portfolioValues,
    portfolioReturns,
    componentReturns,
    componentValues,
    sharesHeld,
    cumulativeContributions,
    cashBufferHistory,
    multiplierHistory,
    volatilityHistory,
    atrHistory,
    correlationMatrix,
    benchmarkTicker: comparisonBenchmark,
    benchmarkReturns,
    benchmarkValues,
    rebalancedValues,
    unrebalancedValues,
    rebalanceDates,
    summary: {
      initialValue: initialInvestment,
      finalValue,
      rebalanceAnnually,
      rebalancedFinalValue,
      unrebalancedFinalValue,
      rebalancingImpact,
      rebalancingImpactPercent,
      rebalanceDates,
      rebalanceCount: rebalanceDates.length,
      totalContributions,
      totalInvestment: totalInvested,
      netProfit,
      totalReturnPercent,
      annualizedReturnPercent,
      maxDrawdownPercent,
      totalFeesPaid,
      componentFinalShares,
      componentFinalValues,
      componentTotalReturns,
      portfolioSharpe,
      benchmarkSharpe,
      portfolioSortino,
      benchmarkSortino,
      portfolioBeta,
      benchmarkFinalValue,
      benchmarkTotalReturnPercent
    }
  };
}

// --- PYTHON GENERATOR ---
function generatePythonCode(
  tickers: string[],
  weights: number[],
  startDate: string,
  dcaMonths: number,
  fees: Record<string, number>,
  initialInvestment: number,
  monthlyContribution: number,
  comparisonBenchmark: string,
  dcaStrategy: string = "fixed",
  dcaMaPeriod: number = 200,
  dcaRefType: string = "portfolio",
  rebalanceAnnually: boolean = true
): string {
  return `"""
================================================================================
Sector ETF Backtester - Python Google Colab Script (Dynamic Rules-Based DCA & Rebalancing)
================================================================================
"""

import pandas as pd
import yfinance as yf
import numpy as np
import datetime

# --- CONFIGURATION (Generated from Sector ETF Backtester) ---
tickers = ${JSON.stringify(tickers)}
comparison_benchmark = '${comparisonBenchmark}'
weights = ${JSON.stringify(weights)}
start_date = '${startDate}'
end_date = (datetime.date.today() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
dca_months = ${dcaMonths}
annual_fees = ${JSON.stringify(fees)}
initial_investment = ${initialInvestment}
monthly_contribution = ${monthlyContribution}
base_prices = ${JSON.stringify(BASE_PRICES)}

dca_strategy = '${dcaStrategy}'
dca_ma_period = ${dcaMaPeriod}
dca_ref_type = '${dcaRefType}'
rebalance_annually = ${rebalanceAnnually ? "True" : "False"}

# Download selected ETFs, SPY, and comparison benchmark
download_tickers = list(set(tickers + ['SPY'] + [comparison_benchmark]))
print(f"Downloading historical data for {download_tickers} from {start_date} to {end_date}...")
df = yf.download(download_tickers, start=start_date, end=end_date, auto_adjust=True)['Close']

if isinstance(df, pd.Series):
    df = df.to_frame(name=download_tickers[0])

# Reindex to business days to match Node.js backend date alignment exactly
all_business_days = pd.date_range(start=start_date, end=end_date, freq='B')
df = df.reindex(all_business_days)

# Handle missing data using forward-fill and back-fill
for ticker in download_tickers:
    if ticker not in df.columns:
        df[ticker] = np.nan
    df[ticker] = df[ticker].ffill()
    if ticker in base_prices:
        df[ticker] = df[ticker].fillna(base_prices[ticker])
    else:
        df[ticker] = df[ticker].fillna(50.0)
    df[ticker] = df[ticker].bfill()

dates = df.index
n_days = len(df)
w = [weight / 100.0 for weight in weights]

# Result Arrays
portfolio_values = np.zeros(n_days)
invested_amounts = np.zeros(n_days)
total_fees_paid = 0.0

current_shares = [0.0] * len(tickers)
standalone_shares = [initial_investment / df[tickers[i]].iloc[0] for i in range(len(tickers))]

# Track active state
total_dca_months_contributed = 0
total_invested = initial_investment

# Cash buffers
cash_buffer = 0.0
benchmark_cash_buffer = 0.0
standalone_cash_buffers = [0.0] * len(tickers)

# Reference values list for MA
ref_values = []
for t_idx in range(n_days):
    if dca_ref_type == 'benchmark':
        ref_val = df[comparison_benchmark].iloc[t_idx]
    else:
        ref_val = sum((weights[i] / 100.0) * df[tickers[i]].iloc[t_idx] for i in range(len(tickers)))
    ref_values.append(ref_val)

# Initial purchase at t = 0
for i, ticker in enumerate(tickers):
    allocated = initial_investment * w[i]
    current_shares[i] = allocated / df[ticker].iloc[0]

last_month = dates[0].strftime('%Y-%m')
last_year = dates[0].strftime('%Y')

component_vals = {ticker: np.zeros(n_days) for ticker in tickers}
component_returns = {ticker: np.zeros(n_days) for ticker in tickers}

p_returns_list = [0.0] * n_days
b_returns_list = [0.0] * n_days
last_spy_price = df['SPY'].iloc[0]

benchmark_shares = initial_investment / df[comparison_benchmark].iloc[0]
benchmark_vals = np.zeros(n_days)

for t_idx, current_date in enumerate(dates):
    current_date_str = current_date.strftime('%Y-%m-%d')
    current_month = current_date.strftime('%Y-%m')
    current_year = current_date.strftime('%Y')
    
    # Calculate Moving Average with zero lookahead bias
    ma = ref_values[0]
    if t_idx > 0:
        start_idx = max(0, t_idx - dca_ma_period)
        ma = np.mean(ref_values[start_idx:t_idx])
        
    ratio = ref_values[t_idx] / ma
    multiplier = 1.0
    if dca_strategy == 'dynamic':
        if ratio >= 1.10: multiplier = 0.5
        elif ratio >= 1.03: multiplier = 0.75
        elif ratio >= 0.97: multiplier = 1.0
        elif ratio >= 0.90: multiplier = 1.5
        else: multiplier = 2.0

    # Annual Rebalancing (including cash_buffer)
    if rebalance_annually and t_idx > 0 and current_year != last_year:
        total_portfolio_val_rebal = cash_buffer
        for i, ticker in enumerate(tickers):
            price_rebal = df[ticker].iloc[t_idx]
            total_portfolio_val_rebal += current_shares[i] * price_rebal
        equity_portion = total_portfolio_val_rebal - cash_buffer
        for i, ticker in enumerate(tickers):
            price_rebal = df[ticker].iloc[t_idx]
            current_shares[i] = (equity_portion * w[i]) / price_rebal
        last_year = current_year
    
    is_dca_day = False
    if dca_months > 0 and t_idx > 0 and current_month != last_month:
        if total_dca_months_contributed < dca_months:
            is_dca_day = True
            total_dca_months_contributed += 1
            total_invested += monthly_contribution
            cash_buffer += monthly_contribution
            benchmark_cash_buffer += monthly_contribution
            for i in range(len(tickers)):
                standalone_cash_buffers[i] += monthly_contribution
        last_month = current_month
        
    # Capture daily returns before DCA purchase to calculate Sharpe/Sortino/Beta
    spy_price_today = df['SPY'].iloc[t_idx]
    if t_idx > 0:
        val_before_dca = cash_buffer
        for i, ticker in enumerate(tickers):
            price_today = df[ticker].iloc[t_idx]
            annual_fee = annual_fees.get(ticker, 0.0)
            daily_fee_rate = annual_fee / 252.0
            val_before_dca += current_shares[i] * (1.0 - daily_fee_rate) * price_today
        
        p_ret = (val_before_dca / portfolio_values[t_idx - 1] - 1.0) if portfolio_values[t_idx - 1] > 0 else 0.0
        p_returns_list[t_idx] = p_ret
        
        b_ret = (spy_price_today / last_spy_price - 1.0) if last_spy_price > 0 else 0.0
        b_returns_list[t_idx] = b_ret
    
    last_spy_price = spy_price_today

    # Deduct fees and accumulate total fees paid
    for i, ticker in enumerate(tickers):
        price = df[ticker].iloc[t_idx]
        daily_fee_rate = annual_fees.get(ticker, 0.0) / 252.0
        val_before_fee = current_shares[i] * price
        fee_deducted_val = val_before_fee * daily_fee_rate
        total_fees_paid += fee_deducted_val
        
        current_shares[i] *= (1.0 - daily_fee_rate)
        standalone_shares[i] *= (1.0 - daily_fee_rate)
        
    # Apply standard index fee to benchmark
    bPrice = df[comparison_benchmark].iloc[t_idx]
    daily_b_fee_rate = 0.0009 / 252.0
    benchmark_shares *= (1.0 - daily_b_fee_rate)

    # Handle DCA purchase
    if is_dca_day:
        if dca_strategy == 'dynamic':
            target_purchase = monthly_contribution * multiplier
            actual_purchase = min(cash_buffer, target_purchase)
            cash_buffer -= actual_purchase
            
            b_actual_purchase = min(benchmark_cash_buffer, target_purchase)
            benchmark_cash_buffer -= b_actual_purchase
            
            for i, ticker in enumerate(tickers):
                s_actual_purchase = min(standalone_cash_buffers[i], target_purchase)
                standalone_cash_buffers[i] -= s_actual_purchase
                standalone_shares[i] += s_actual_purchase / df[ticker].iloc[t_idx]
        else:
            actual_purchase = min(cash_buffer, monthly_contribution)
            cash_buffer -= actual_purchase
            
            b_actual_purchase = min(benchmark_cash_buffer, monthly_contribution)
            benchmark_cash_buffer -= b_actual_purchase
            
            for i, ticker in enumerate(tickers):
                s_actual_purchase = min(standalone_cash_buffers[i], monthly_contribution)
                standalone_cash_buffers[i] -= s_actual_purchase
                standalone_shares[i] += s_actual_purchase / df[ticker].iloc[t_idx]
                
        # Purchase shares
        for i, ticker in enumerate(tickers):
            allocated = actual_purchase * w[i]
            current_shares[i] += allocated / df[ticker].iloc[t_idx]
        benchmark_shares += b_actual_purchase / bPrice

    # Calculate values at end of day
    total_portfolio_val = cash_buffer
    for i, ticker in enumerate(tickers):
        price = df[ticker].iloc[t_idx]
        val = current_shares[i] * price
        total_portfolio_val += val
        component_vals[ticker][t_idx] = val + standalone_cash_buffers[i]
        
        s_val = standalone_shares[i] * price + standalone_cash_buffers[i]
        component_returns[ticker][t_idx] = (s_val / total_invested) - 1.0
        
    portfolio_values[t_idx] = total_portfolio_val
    invested_amounts[t_idx] = total_invested
    benchmark_vals[t_idx] = benchmark_shares * bPrice + benchmark_cash_buffer

final_value = portfolio_values[-1]
net_profit = final_value - total_invested
total_return = (final_value / total_invested - 1.0) * 100.0

days_diff = (dates[-1] - dates[0]).days
years = max(days_diff / 365.25, 0.05)
cagr = (pow(final_value / total_invested, 1.0 / years) - 1.0) * 100.0

peak = portfolio_values[0]
max_dd = 0.0
for val in portfolio_values:
    if val > peak:
        peak = val
    dd = (peak - val) / peak
    if dd > max_dd:
        max_dd = dd
    max_dd_pct = max_dd * 100.0

# Calculate Sharpe, Sortino, and Beta
rf_annual = 0.02
rf_daily = rf_annual / 252.0
num_return_days = n_days - 1

avg_p_ret = np.mean(p_returns_list[1:]) if num_return_days > 0 else 0.0
avg_b_ret = np.mean(b_returns_list[1:]) if num_return_days > 0 else 0.0

p_daily_std = np.std(p_returns_list[1:], ddof=1) if num_return_days > 1 else 0.0
b_daily_std = np.std(b_returns_list[1:], ddof=1) if num_return_days > 1 else 0.0

portfolio_sharpe = (np.sqrt(252) * (avg_p_ret - rf_daily)) / p_daily_std if p_daily_std > 0 else 0.0
benchmark_sharpe = (np.sqrt(252) * (avg_b_ret - rf_daily)) / b_daily_std if b_daily_std > 0 else 0.0

p_downside_returns = [r - rf_daily for r in p_returns_list[1:] if (r - rf_daily) < 0]
p_downside_std = np.sqrt(np.sum(np.square(p_downside_returns)) / (num_return_days - 1)) if num_return_days > 1 and len(p_downside_returns) > 0 else 0.0
portfolio_sortino = (np.sqrt(252) * (avg_p_ret - rf_daily)) / p_downside_std if p_downside_std > 0 else 0.0

cov_matrix = np.cov(p_returns_list[1:], b_returns_list[1:]) if num_return_days > 1 else None
portfolio_beta = cov_matrix[0, 1] / cov_matrix[1, 1] if cov_matrix is not None and cov_matrix[1, 1] > 0 else 1.0

benchmark_final_value = benchmark_vals[-1]
benchmark_total_return = (benchmark_final_value / total_invested - 1.0) * 100.0

print("\\n" + "="*50)
print("             BACKTEST SUMMARY")
print("="*50)
print(f"Initial Investment:    \${"$"}{initial_investment:,.2f}")
print(f"Monthly DCA:           \${"$"}{monthly_contribution:,.2f} over {dca_months} months")
print(f"Total Invested:        \${"$"}{total_invested:,.2f}")
print(f"Final Balance:         \${"$"}{final_value:,.2f}")
print(f"Net Profit:            \${"$"}{net_profit:,.2f}")
print(f"Total Return:          {total_return:.2f}%")
print(f"Annualized Return CAGR: {cagr:.2f}%")
print(f"Maximum Drawdown:      {max_dd_pct:.2f}%")
print(f"Total Fees Paid:       \${"$"}{total_fees_paid:,.2f}")
print("="*50)
print("             RISK METRICS (vs SPY)")
print("="*50)
print(f"Portfolio Sharpe Ratio: {portfolio_sharpe:.2f} (Benchmark SPY: {benchmark_sharpe:.2f})")
print(f"Portfolio Sortino Ratio: {portfolio_sortino:.2f}")
print(f"Portfolio Beta (v SPY): {portfolio_beta:.2f}")
print("="*50)
print(f"BENCHMARK {comparison_benchmark} PERFORMANCE (with DCA)")
print("="*50)
print(f"Final Balance:         \${"$"}{benchmark_final_value:,.2f}")
print(f"Total Return:          {benchmark_total_return:.2f}%")
print("="*50)

# Plotting using Plotly Express (Interactive, lets you toggle individual series by clicking the legend)
import plotly.express as px

# Prepare dataset for plotting
plot_data = {
    'Date': dates,
    'Combined Portfolio': portfolio_values,
    f'Benchmark {comparison_benchmark}': benchmark_vals
}

for ticker in tickers:
    # Compute standalone ETF growth with DCA
    s_shares = initial_investment / df[ticker].iloc[0]
    s_vals = np.zeros(n_days)
    s_last_month = dates[0].strftime('%Y-%m')
    s_total_dca_months = 0
    s_cash_buf = 0.0
    
    for t_idx, current_date in enumerate(dates):
        current_month = current_date.strftime('%Y-%m')
        s_is_dca = False
        if dca_months > 0 and t_idx > 0 and current_month != s_last_month:
            if s_total_dca_months < dca_months:
                s_is_dca = True
                s_total_dca_months += 1
                s_cash_buf += monthly_contribution
            s_last_month = current_month
        
        price = df[ticker].iloc[t_idx]
        daily_fee_rate = annual_fees.get(ticker, 0.0) / 252.0
        s_shares *= (1.0 - daily_fee_rate)
        
        if s_is_dca:
            if dca_strategy == 'dynamic':
                s_purchase = min(s_cash_buf, monthly_contribution * multiplier)
            else:
                s_purchase = min(s_cash_buf, monthly_contribution)
            s_cash_buf -= s_purchase
            s_shares += s_purchase / price
            
        s_vals[t_idx] = s_shares * price + s_cash_buf
        
    plot_data[f'100% {ticker}'] = s_vals

plot_df = pd.DataFrame(plot_data)

# Melt dataframe to long-form format suitable for Plotly Express
melted_df = plot_df.melt(id_vars=['Date'], var_name='Asset/Portfolio', value_name='Portfolio Value ($)')

# Generate interactive interactive line plot using Plotly Express
fig = px.line(
    melted_df,
    x='Date',
    y='Portfolio Value ($)',
    color='Asset/Portfolio',
    title='Portfolio Value Growth Comparison (with DCA & Fees)',
    template='plotly_white'
)

# Customize the layout for optimal dashboard look and high interactivity
fig.update_layout(
    xaxis_title='Date',
    yaxis_title='Portfolio Value ($)',
    legend_title='Click to Toggle Series',
    hovermode='x unified',
    margin=dict(l=40, r=40, t=60, b=40),
    title_font=dict(size=16, family="Arial, sans-serif"),
    font=dict(family="Arial, sans-serif", size=12)
)

fig.show()
`;
}

// --- API ENDPOINTS ---

app.post("/api/backtest", async (req, res) => {
  try {
    const {
      tickers,
      weights,
      startDate,
      dcaMonths,
      fees,
      initialInvestment = 10000,
      monthlyContribution = 500,
      comparisonBenchmark = "QQQ",
      dcaStrategy = "fixed",
      dcaMaPeriod = 200,
      dcaRefType = "portfolio",
      rebalanceAnnually = true
    } = req.body;

    if (!tickers || tickers.length !== 3) {
      return res.status(400).json({ error: "Exactly 3 ETFs must be selected." });
    }
    if (!weights || weights.length !== 3) {
      return res.status(400).json({ error: "Exactly 3 weights must be provided." });
    }

    const sumWeights = weights.reduce((a: number, b: number) => a + b, 0);
    if (Math.abs(sumWeights - 100) > 0.1) {
      return res.status(400).json({ error: "ETF weights must sum to 100%." });
    }

    // Earliest date is today() - 1 business day or user selected start date
    const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    // Fetch prices for all selected ETFs + SPY + comparisonBenchmark
    const benchmarkTicker = comparisonBenchmark || "QQQ";
    const uniqueTickersToFetch = Array.from(new Set([...tickers, "SPY", benchmarkTicker]));
    
    const fetchPromises = uniqueTickersToFetch.map((t: string) => getExtendedETFPrices(t, startDate, endDate));
    const priceResults = await Promise.all(fetchPromises);
    
    const priceData: Record<string, { date: string, price: number }[]> = {};
    uniqueTickersToFetch.forEach((t: string, i: number) => {
      priceData[t] = priceResults[i];
    });

    const spyResults = priceData["SPY"];

    // Run Backtest
    const backtest = runBacktest(
      tickers,
      weights,
      priceData,
      dcaMonths,
      fees,
      initialInvestment,
      monthlyContribution,
      spyResults,
      benchmarkTicker,
      dcaStrategy,
      dcaMaPeriod,
      dcaRefType,
      Boolean(rebalanceAnnually)
    );

    const pythonCode = generatePythonCode(
      tickers,
      weights,
      startDate,
      dcaMonths,
      fees,
      initialInvestment,
      monthlyContribution,
      benchmarkTicker,
      dcaStrategy,
      dcaMaPeriod,
      dcaRefType,
      Boolean(rebalanceAnnually)
    );

    res.json({
      ...backtest,
      pythonCode,
      etfNames: ETF_NAMES
    });
  } catch (error: any) {
    console.error("Backtest route error:", error);
    res.status(500).json({ error: error.message || "Failed to execute backtest." });
  }
});

// Gemini Analysis Route
app.post("/api/analyze", async (req, res) => {
  try {
    const { backtestData, params } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        analysis: `### 🤖 Gemini AI Insights (Demo Mode)

The Gemini API Key is not set in the **Settings > Secrets** panel. However, here is a professional diagnostic breakdown based on your parameters:

- **Portfolio Breakdown**: Your chosen assets (${params.tickers.join(", ")}) represent a custom blend targeting the specific sectors selected.
- **Dynamic Fee Drag**: Your average fund fee is **${(Object.values(params.fees as Record<string, number>).reduce((a, b) => a + b, 0) / 3 * 100).toFixed(2)}%**. Over the selected backtest timeframe, this created an estimated expense drag of **$${backtestData.summary.totalFeesPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**.
- **Dollar Cost Average (DCA) Analysis**: Spreading Contributions over **${params.dcaMonths} months** reduced volatility by preventing full entry at a market peak, allowing you to accumulate more shares when prices were depressed.
- **Annual Rebalancing Impact**: Automatic annual rebalancing is **${params.rebalanceAnnually ? "ENABLED" : "DISABLED"}**. ${backtestData.summary.rebalancingImpact !== undefined ? `The net impact of rebalancing on the final balance is **${backtestData.summary.rebalancingImpact >= 0 ? "+" : ""}$${backtestData.summary.rebalancingImpact.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${backtestData.summary.rebalancingImpactPercent >= 0 ? "+" : ""}${backtestData.summary.rebalancingImpactPercent.toFixed(2)}%)** compared to unmanaged drift.` : ""}
- **Key Metrics Summary**:
  - **Starting Value**: $${backtestData.summary.initialValue.toLocaleString()}
  - **Final Balance**: $${backtestData.summary.finalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
  - **Net Return**: ${backtestData.summary.totalReturnPercent.toFixed(2)}% (CAGR: ${backtestData.summary.annualizedReturnPercent.toFixed(2)}%)
  - **Max Portfolio Drawdown**: ${backtestData.summary.maxDrawdownPercent.toFixed(2)}%

*To unlock customized, institutional-grade strategic advice, please provide a valid \`GEMINI_API_KEY\` in your environment variables.*`
      });
    }

    const prompt = `Please analyze the following ETF portfolio backtest results:
Portfolio: ${params.tickers.map((t: string, i: number) => `${t} (${params.weights[i]}%)`).join(", ")}
Start Date: ${params.startDate}
DCA Strategy: ${params.dcaMonths} Months of DCA contributions of $${params.monthlyContribution}/month (Initial investment: $${params.initialInvestment})
Annual Expense Ratio Fees: ${JSON.stringify(params.fees)}
Annual Automatic Rebalancing: ${params.rebalanceAnnually ? "Enabled" : "Disabled"} (Rebalance Impact on Final Balance: ${backtestData.summary.rebalancingImpact >= 0 ? "+" : ""}$${backtestData.summary.rebalancingImpact.toFixed(2)})

Backtest Summary:
- Initial Value: $${backtestData.summary.initialValue}
- Final Value: $${backtestData.summary.finalValue.toFixed(2)}
- Total Contributions: $${backtestData.summary.totalContributions}
- Total Invested: $${backtestData.summary.totalInvestment}
- Net Profit: $${backtestData.summary.netProfit.toFixed(2)}
- Total Return: ${backtestData.summary.totalReturnPercent.toFixed(2)}%
- Annualized CAGR: ${backtestData.summary.annualizedReturnPercent.toFixed(2)}%
- Max Drawdown: ${backtestData.summary.maxDrawdownPercent.toFixed(2)}%
- Total Fees Paid: $${backtestData.summary.totalFeesPaid.toFixed(2)}

Standalone Component Returns:
${params.tickers.map((t: string) => `- ${t}: ${backtestData.summary.componentTotalReturns[t].toFixed(2)}%`).join("\n")}

Please write a comprehensive, professional, institutional-grade analysis in clean Markdown.
Address:
1. **Asset Allocation & Diversification Efficiency**: Is the risk profile balanced? Discuss correlation between these sectors.
2. **The DCA Multiplier Effect**: Evaluate how the DCA strategy performed compared to a potential lump-sum strategy for these specific sectors.
3. **Fee Drag Diagnostic**: Analyze how the selected fees dragged on compounding returns and outline any recommendations.
4. **Actionable Strategic Outlook**: Give specific macroeconomic scenarios where this custom sector blend would excel or struggle. Keep it structured and visually polished with bullet points. Do not include financial advice warnings; act as an expert research analyst.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an institutional-grade financial analyst and portfolio strategist. Offer clean, structured, objective, and highly professional insights about portfolio performance, fee drag, and Dollar Cost Averaging impacts."
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.json({ analysis: "### ⚠️ Error Generating Analysis\n\nFailed to contact Gemini API. Please make sure the `GEMINI_API_KEY` is correctly configured in your settings, or try again later." });
  }
});

// --- VITE DEV/PROD MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
