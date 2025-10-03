"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";


export default function Courses() {
const sb = supabaseBrowser();
const [rows, setRows] = useState<any[]>([]);
useEffect(()=>{ (async()=>{
console.info('[Courses] fetching');
const { data, error } = await sb.from('courses').select('name, timezone').order('name');
if (error) console.error('[Courses] error', error);
console.info('[Courses] fetched', (data||[]).length);
setRows(data||[]);
})(); },[]);
return (
<div className="rounded-2xl border bg-card shadow-sm">
<div className="p-4"><h2 className="text-base font-semibold">Courses</h2></div>
<div className="grid grid-cols-2 border-t text-xs text-muted-foreground">
<div className="p-3">Course</div>
<div className="p-3 text-right">Timezone</div>
</div>
{rows.map((r)=>(
<div key={r.name} className="grid grid-cols-2 items-center border-b last:border-b-0">
<div className="p-3 text-sm">{r.name}</div>
<div className="p-3 text-right text-sm font-medium">{r.timezone}</div>
</div>
))}
</div>
);
}
