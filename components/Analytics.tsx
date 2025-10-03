"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";


export default function Analytics() {
const sb = supabaseBrowser();
const [rows, setRows] = useState<any[]>([]);
useEffect(()=>{ (async()=>{
console.info('[Analytics] fetching rollups');
const { data, error } = await sb.from('v_org_campaign_rollup').select('campaign_id, sent, delivered, read, clicked, replied, est_revenue').limit(100);
if (error) console.error('[Analytics] error', error);
console.info('[Analytics] fetched', (data||[]).length);
setRows(data||[]);
})(); },[]);
return (
<div className="rounded-2xl border bg-card p-4 shadow-sm">
<h2 className="text-base font-semibold mb-2">Campaign Rollups</h2>
<div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
<div>Campaign</div><div>Sent</div><div>Delivered</div><div>Read</div><div>Clicked</div><div>Est Rev</div>
</div>
<div className="mt-1 space-y-1">
{rows.map((r)=>(
<div key={r.campaign_id} className="grid grid-cols-6 gap-2 text-sm rounded-xl border px-3 py-2">
<div className="truncate">{r.campaign_id}</div>
<div>{r.sent}</div>
<div>{r.delivered}</div>
<div>{r.read}</div>
<div>{r.clicked}</div>
<div>${''+r.est_revenue}</div>
</div>
))}
</div>
</div>
);
}
