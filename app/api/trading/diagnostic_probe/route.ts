import { NextRequest, NextResponse } from "next/server";
import { KiwoomClient } from "@/lib/kiwoom";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "20260406";
    const accounts = KiwoomClient.getAccounts();

    if (accounts.length === 0) return NextResponse.json({ error: "No accounts" });

    const acc = accounts[0]; 
    const probeResults: any = {};

    // Final precision test for kt00007 - addressing the multi-layered mandatory field errors
    const scenarios = [
      { 
        id: "kt00007", 
        path: "/api/dostk/acnt",
        params: { 
          base_dt: date, 
          qry_tp: "0", 
          stk_bond_tp: "01", 
          sell_tp: "0",
          dmst_stex_tp: "KRX", // Based on other methods in kiwoom.ts
          ord_dvsn_cd: "00",
          ex_dvsn_cd: "00",
          ottks_tp: "0", 
          ch_crd_tp: "0" 
        } 
      },
      { 
        id: "kt00007", 
        path: "/api/dostk/acnt",
        params: { 
          base_dt: date, 
          qry_tp: "0", 
          stk_bond_tp: "01", 
          sell_tp: "0",
          dmst_stex_tp: "01", // Alternative exchange code
          ottks_tp: "0", 
          ch_crd_tp: "0" 
        } 
      }
    ];

    for (let i = 0; i < scenarios.length; i++) {
       const s = scenarios[i];
       const key = `${s.id}_${i}_onion_layer_${s.params.dmst_stex_tp}`;
       try {
         const res = await (KiwoomClient as any).request(acc, s.path, s.id, s.params);
         if (res && !res.error) {
           const logArray = res.res_cntg_list || res.output || res.output1 || res.detail || res.tdy_trde_diary || [];
           if (Array.isArray(logArray) && logArray.length > 0) {
             probeResults[key] = {
               count: logArray.length,
               keys: Object.keys(logArray[0]),
               sample: logArray[0]
             };
           } else {
             probeResults[key] = { count: 0, message: "Success but no data", raw: res };
           }
         } else {
           probeResults[key] = { error: res?.error || "Unknown", raw: res };
         }
       } catch (e: any) {
         probeResults[key] = { error: e.message };
       }
    }

    return NextResponse.json({
      probe_date: date,
      results: probeResults
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
