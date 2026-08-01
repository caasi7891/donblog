/**
 * KIS (Korea Investment & Securities) token client for DonBlog.
 * Token issuance only for now — used by the manual Refresh Token button.
 */

const BASE_URL = "https://openapi.koreainvestment.com:9443";

interface AccountConfig {
  appKey: string;
  secretKey: string;
  accountNo: string;
  label: string;
}

class TokenManager {
  private static tokenStore = new Map<string, { token: string; expiresAt: number }>();

  static async getToken(appKey: string, secretKey: string, forceRefresh = false): Promise<string> {
    const cached = this.tokenStore.get(appKey);
    if (!forceRefresh && cached && Date.now() < cached.expiresAt - 600_000) {
      return cached.token;
    }

    if (forceRefresh) console.log(`[DEBUG] Force refreshing KIS token for ${appKey.slice(0, 5)}...`);

    const res = await fetch(`${BASE_URL}/oauth2/tokenP`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: appKey,
        appsecret: secretKey,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`KIS token request failed: HTTP ${res.status} — ${err}`);
    }

    const resBody = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error_description?: string;
      msg?: string;
    };

    if (!resBody.access_token) {
      throw new Error(
        `KIS token missing access_token: ${resBody.error_description || resBody.msg || JSON.stringify(resBody)}`
      );
    }

    const expiresAt = Date.now() + (resBody.expires_in ?? 82800) * 1000;
    this.tokenStore.set(appKey, { token: resBody.access_token, expiresAt });
    return resBody.access_token;
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

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/['"]/g, "");
}

export class KisClient {
  static getAccounts(): AccountConfig[] {
    const configs: AccountConfig[] = [];
    try {
      if (process.env.KIS_ACC1_NUMBER) {
        configs.push({
          label: "KIS Acc 1",
          accountNo: trimEnv(process.env.KIS_ACC1_NUMBER),
          appKey: trimEnv(process.env.KIS_ACC1_APP_KEY),
          secretKey: trimEnv(process.env.KIS_ACC1_APP_SECRET),
        });
      }
      if (process.env.KIS_ACC2_NUMBER) {
        configs.push({
          label: "KIS Acc 2",
          accountNo: trimEnv(process.env.KIS_ACC2_NUMBER),
          appKey: trimEnv(process.env.KIS_ACC2_APP_KEY),
          secretKey: trimEnv(process.env.KIS_ACC2_APP_SECRET),
        });
      }
    } catch (e) {
      console.error("Error parsing KIS accounts from .env:", e);
    }
    return configs.filter((c) => c.appKey && c.secretKey);
  }

  /**
   * Force-refresh OAuth tokens for every configured KIS account (deduped by appKey).
   */
  static async refreshAllTokens(): Promise<
    { broker: "kis"; label: string; ok: boolean; expiresAt?: string; error?: string }[]
  > {
    const accounts = this.getAccounts();
    const results: { broker: "kis"; label: string; ok: boolean; expiresAt?: string; error?: string }[] = [];
    const seen = new Set<string>();

    for (const acc of accounts) {
      if (seen.has(acc.appKey)) continue;
      seen.add(acc.appKey);
      try {
        await TokenManager.getToken(acc.appKey, acc.secretKey, true);
        const status = TokenManager.getStatus(acc.appKey);
        results.push({
          broker: "kis",
          label: acc.label,
          ok: true,
          expiresAt: status.expiresAt ? new Date(status.expiresAt).toISOString() : undefined,
        });
      } catch (err: unknown) {
        results.push({
          broker: "kis",
          label: acc.label,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }
}
