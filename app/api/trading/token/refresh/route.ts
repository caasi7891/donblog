import { NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";
import { KisClient } from "@/lib/kis";

/**
 * POST /api/trading/token/refresh
 * Manually refresh Kiwoom + KIS OAuth tokens for all configured accounts.
 * One button → all brokers/accounts.
 */
export async function POST() {
  try {
    const kiwoomAccounts = KiwoomClient.getAccounts();
    const kisAccounts = KisClient.getAccounts();

    if (kiwoomAccounts.length === 0 && kisAccounts.length === 0) {
      return NextResponse.json(
        { error: "No Kiwoom or KIS accounts configured" },
        { status: 400 }
      );
    }

    const [kiwoomResults, kisResults] = await Promise.all([
      kiwoomAccounts.length > 0 ? KiwoomClient.refreshAllTokens() : Promise.resolve([]),
      kisAccounts.length > 0 ? KisClient.refreshAllTokens() : Promise.resolve([]),
    ]);

    const results = [...kiwoomResults, ...kisResults];
    const allOk = results.length > 0 && results.every((r) => r.ok);
    const okCount = results.filter((r) => r.ok).length;

    return NextResponse.json(
      {
        success: allOk,
        okCount,
        total: results.length,
        results,
      },
      { status: allOk ? 200 : 502 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
