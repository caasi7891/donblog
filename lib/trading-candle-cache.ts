import { promises as fs } from "fs";
import path from "path";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type CandleCacheFile = {
  stock_code: string;
  trading_date: string;
  candles: Candle[];
};

const CACHE_DIR = path.join(process.cwd(), "logs", "trading", "candles");

/** Normalize stock codes the same way as the chart API route. */
export function normalizeStockCode(code: string): string {
  const incoming = (code || "").trim().replace(/^A/, "");
  return incoming.replace(/_AL$/, "").replace(/[^0-9a-zA-Z]/g, "");
}

function cacheFilePath(stockCode: string, date: string): string {
  const code = normalizeStockCode(stockCode);
  return path.join(CACHE_DIR, `${code}_${date}.json`);
}

export async function getCachedCandles(
  stockCode: string,
  date: string
): Promise<Candle[] | null> {
  const filePath = cacheFilePath(stockCode, date);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as CandleCacheFile;
    if (Array.isArray(parsed?.candles) && parsed.candles.length > 0) {
      return parsed.candles;
    }
    return null;
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    console.error(`[DEBUG] Failed to read candle cache ${filePath}:`, err);
    return null;
  }
}

export async function setCachedCandles(
  stockCode: string,
  date: string,
  candles: Candle[]
): Promise<void> {
  if (!candles.length) return;

  const code = normalizeStockCode(stockCode);
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const payload: CandleCacheFile = {
    stock_code: code,
    trading_date: date,
    candles,
  };

  const filePath = cacheFilePath(code, date);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const body = JSON.stringify(payload);

  await fs.writeFile(tmpPath, body, "utf-8");
  await fs.rename(tmpPath, filePath);
}

export function getCandleCacheDir(): string {
  return CACHE_DIR;
}
