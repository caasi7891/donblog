/**
 * One-time migration: Supabase trading_candles → local JSON files.
 *
 * Usage: node scripts/migrate-trading-candles.mjs
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env)
 */
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, "logs", "trading", "candles");

function loadEnvFile() {
  // Minimal .env loader (KEY=value, optional quotes)
  try {
    const raw = readFileSync(path.join(ROOT, ".env"), "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

function normalizeStockCode(code) {
  const incoming = String(code || "")
    .trim()
    .replace(/^A/, "");
  return incoming.replace(/_AL$/, "").replace(/[^0-9a-zA-Z]/g, "");
}

async function main() {
  loadEnvFile();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env/.env"
    );
    process.exit(1);
  }

  console.log("Fetching trading_candles from Supabase...");
  const res = await fetch(
    `${url}/rest/v1/trading_candles?select=stock_code,trading_date,candles`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Supabase fetch failed:", res.status, await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) {
    console.error("Unexpected response:", rows);
    process.exit(1);
  }

  console.log(`Fetched ${rows.length} row(s). Writing to ${CACHE_DIR}`);
  await fs.mkdir(CACHE_DIR, { recursive: true });

  // Detect key collisions after normalization; keep longest candles array.
  /** @type {Map<string, { stock_code: string, trading_date: string, candles: any[], rawCodes: string[] }>} */
  const byKey = new Map();

  for (const row of rows) {
    const code = normalizeStockCode(row.stock_code);
    const date = String(row.trading_date || "").replace(/-/g, "");
    const candles = Array.isArray(row.candles) ? row.candles : [];
    const keyName = `${code}_${date}`;

    if (!code || !date) {
      console.warn("  skip invalid row:", row.stock_code, row.trading_date);
      continue;
    }

    const existing = byKey.get(keyName);
    if (!existing) {
      byKey.set(keyName, {
        stock_code: code,
        trading_date: date,
        candles,
        rawCodes: [String(row.stock_code)],
      });
    } else {
      existing.rawCodes.push(String(row.stock_code));
      if (candles.length >= existing.candles.length) {
        existing.candles = candles;
      }
    }
  }

  let collisions = 0;
  for (const [k, v] of byKey) {
    const uniqueRaw = [...new Set(v.rawCodes)];
    if (uniqueRaw.length > 1) {
      collisions++;
      console.log(
        `  collision ${k}: raw codes ${uniqueRaw.join(", ")} → kept ${v.candles.length} candles`
      );
    }
  }

  let written = 0;
  let failed = 0;

  for (const [keyName, v] of byKey) {
    if (!v.candles.length) {
      console.warn(`  skip empty candles: ${keyName}`);
      continue;
    }
    const filePath = path.join(CACHE_DIR, `${keyName}.json`);
    const payload = {
      stock_code: v.stock_code,
      trading_date: v.trading_date,
      candles: v.candles,
    };
    try {
      const tmp = `${filePath}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(payload), "utf-8");
      await fs.rename(tmp, filePath);
      written++;
      console.log(
        `  wrote ${keyName}.json (${v.candles.length} candles, ${(JSON.stringify(payload).length / 1024).toFixed(1)} KB)`
      );
    } catch (err) {
      failed++;
      console.error(`  failed ${keyName}:`, err.message);
    }
  }

  console.log("\n=== Migration summary ===");
  console.log(`  source rows : ${rows.length}`);
  console.log(`  unique keys : ${byKey.size}`);
  console.log(`  collisions  : ${collisions}`);
  console.log(`  written     : ${written}`);
  console.log(`  failed      : ${failed}`);
  console.log(`  output dir  : ${CACHE_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
