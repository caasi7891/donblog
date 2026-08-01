
/**
 * Kiwoom REST API Client for DonBlog
 * Supports Multiple Accounts & Dynamic Token Management
 */

const BASE_URL = process.env.KIWOOM_IS_MOCK === "true" 
  ? "https://mockapi.kiwoom.com" 
  : "https://api.kiwoom.com";

interface AccountConfig {
  appKey: string;
  secretKey: string;
  accountNo: string;
  label: string;
}

class TokenManager {
  private static tokenStore = new Map<string, { token: string; expiresAt: number }>();

  /** Resolve absolute expiry (ms). Prefer expires_dt (KST), then expires_in, else 23h. */
  private static resolveExpiresAt(resBody: {
    expires_in?: number | string;
    expires_dt?: string;
  }): number {
    if (typeof resBody.expires_dt === "string" && /^\d{14}$/.test(resBody.expires_dt)) {
      const s = resBody.expires_dt;
      const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+09:00`;
      return new Date(iso).getTime();
    }
    if (resBody.expires_in) {
      return Date.now() + Number(resBody.expires_in) * 1000;
    }
    return Date.now() + 23 * 3600 * 1000;
  }

  static async getToken(appKey: string, secretKey: string, forceRefresh = false): Promise<string> {
    const cached = this.tokenStore.get(appKey);
    // Use token until 10 min before real expiry
    if (!forceRefresh && cached && Date.now() < cached.expiresAt - 600_000) {
      return cached.token;
    }

    if (forceRefresh) console.log(`[DEBUG] Force refreshing token for ${appKey.slice(0, 5)}...`);

    const res = await fetch(`${BASE_URL}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: appKey,
        secretkey: secretKey,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Token Request Failed: ${err}`);
    }

    const resBody = await res.json();
    if (typeof resBody.return_code === "number" && resBody.return_code !== 0) {
      throw new Error(`Token rejected: ${resBody.return_msg ?? `code ${resBody.return_code}`}`);
    }

    const token = resBody.access_token || resBody.token || (resBody.data && resBody.data.token);

    if (!token) {
      throw new Error(`Token not found in response: ${JSON.stringify(resBody)}`);
    }

    const expiresAt = this.resolveExpiresAt(resBody);
    this.tokenStore.set(appKey, { token, expiresAt });
    return token;
  }

  static getStatus(appKey: string): { hasToken: boolean; expiresAt: number | null } {
    const cached = this.tokenStore.get(appKey);
    if (!cached) return { hasToken: false, expiresAt: null };
    return { hasToken: Date.now() < cached.expiresAt, expiresAt: cached.expiresAt };
  }

  static invalidate(appKey: string) {
    this.tokenStore.delete(appKey);
  }
}

export class KiwoomClient {
  static getAccounts(): AccountConfig[] {
    const configs: AccountConfig[] = [];
    try {
      if (process.env.KIWOOM_ACC1_NUMBER) {
        configs.push({
          label: "Kiwoom Acc 1",
          accountNo: process.env.KIWOOM_ACC1_NUMBER.trim().replace(/['"]/g, ""),
          appKey: process.env.KIWOOM_ACC1_APP_KEY!.trim().replace(/['"]/g, ""),
          secretKey: process.env.KIWOOM_ACC1_APP_SECRET!.trim().replace(/['"]/g, ""),
        });
      }
      if (process.env.KIWOOM_ACC2_NUMBER) {
        configs.push({
          label: "Kiwoom Acc 2",
          accountNo: process.env.KIWOOM_ACC2_NUMBER.trim().replace(/['"]/g, ""),
          appKey: process.env.KIWOOM_ACC2_APP_KEY!.trim().replace(/['"]/g, ""),
          secretKey: process.env.KIWOOM_ACC2_APP_SECRET!.trim().replace(/['"]/g, ""),
        });
      }
    } catch (e) {
      console.error("Error parsing Kiwoom accounts from .env:", e);
    }
    return configs;
  }

  /**
   * Force-refresh OAuth tokens for every configured Kiwoom account (deduped by appKey).
   * Used by the manual "Refresh Token" button in the top nav.
   */
  static async refreshAllTokens(): Promise<
    { broker: "kiwoom"; label: string; ok: boolean; expiresAt?: string; error?: string }[]
  > {
    const accounts = this.getAccounts();
    const results: { broker: "kiwoom"; label: string; ok: boolean; expiresAt?: string; error?: string }[] = [];
    const seen = new Set<string>();

    for (const acc of accounts) {
      if (seen.has(acc.appKey)) continue;
      seen.add(acc.appKey);
      try {
        await TokenManager.getToken(acc.appKey, acc.secretKey, true);
        const status = TokenManager.getStatus(acc.appKey);
        results.push({
          broker: "kiwoom",
          label: acc.label,
          ok: true,
          expiresAt: status.expiresAt ? new Date(status.expiresAt).toISOString() : undefined,
        });
      } catch (err: unknown) {
        results.push({
          broker: "kiwoom",
          label: acc.label,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }

  private static async request(config: AccountConfig, path: string, apiId: string, body: any = {}) {
    const doExRequest = async (forceTokenRefresh = false) => {
      try {
        const token = await TokenManager.getToken(config.appKey, config.secretKey, forceTokenRefresh);
        const headers: Record<string, string> = {
          "Content-Type": "application/json;charset=UTF-8",
          "Authorization": `Bearer ${token}`,
          "appkey": config.appKey,
          "secretkey": config.secretKey,
          "api-id": apiId,
        };

        const res = await fetch(`${BASE_URL}${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...body, acc_no: config.accountNo }),
        });

        const resBody = await res.json();

        // Check for "Invalid Token" error (Code 3)
        if (res.status === 401 || (resBody && (resBody.return_code === 3 || resBody.return_code === "3"))) {
          if (forceTokenRefresh) {
            // Already retried with a fresh token and still failed
            console.error(`[ERROR] Auth failed even after token refresh for ${config.label}. Check AppKey/IP/Mock settings.`);
            return { error: "auth_failed_permanent", ...resBody };
          }
          return null; // Signals to retry once
        }

        if (!res.ok) {
          return { error: `HTTP_${res.status}`, message: await res.text() };
        }

        return resBody;
      } catch (err: any) {
        return { error: "request_failed", message: err.message };
      }
    };

    let result = await doExRequest(false);
    if (result === null) {
      // Retry once with a forced fresh token
      result = await doExRequest(true);
    }
    return result;
  }

  static async getTradeHistory(config: AccountConfig, date?: string) {
    const targetDate = date || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0].replace(/-/g, "");
    return this.request(config, "/api/dostk/acnt", "ka10170", {
      base_dt: targetDate,
      ottks_tp: "2",
      ch_crd_tp: "0",
    });
  }

  static async getExecutionHistory(config: AccountConfig, date?: string) {
    const targetDate = date || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0].replace(/-/g, "");
    return this.request(config, "/api/dostk/acnt", "ka10810", {
      base_dt: targetDate,
      ottks_tp: "0",
      ch_crd_tp: "0",
    });
  }

  static async getAccountEvaluation(config: AccountConfig) {
    return this.request(config, "/api/dostk/acnt", "kt00018", {
      qry_tp: "1",
      dmst_stex_tp: "KRX",
    });
  }

  // 기간별주문체결상세 - kt00009 (returns individual execution rows)
  static async getOrderExecutionDetail(config: AccountConfig, date?: string) {
    const targetDate = date || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).split(" ")[0].replace(/-/g, "");
    return this.request(config, "/api/dostk/acnt", "kt00009", {
      ord_dt: targetDate,
      stk_bond_tp: "0",   // 0: All (stock + bond)
      mrkt_tp: "0",       // 0: All markets
      sell_tp: "0",       // 0: All (buy + sell)
      qry_tp: "1",        // 1: Order date search
      stk_cd: "",         // empty = all stocks
      fr_ord_no: "",      // empty = from beginning
      dmst_stex_tp: "%",  // All
    });
  }

  static async placeOrder(config: AccountConfig, action: "buy" | "sell", stockCode: string, quantity: number, price: number = 0, orderType: "market" | "limit" = "market") {
    const apiId = action === "buy" ? "kt10000" : "kt10001";
    return this.request(config, "/api/dostk/ordr", apiId, {
      dmst_stex_tp: "KRX",
      stk_cd: stockCode,
      ord_qty: String(quantity),
      ord_uv: orderType === "limit" ? String(price) : "0",
      trde_tp: orderType === "market" ? "3" : "0",
    });
  }

  static async getMinuteChart(config: AccountConfig, stockCode: string, date: string) {
    return this.request(config, "/api/dostk/chart", "ka10080", {
      stk_cd: stockCode,
      tic_scope: "1",
      upd_stkpc_tp: "1",
      base_dt: date,
    });
  }
}
