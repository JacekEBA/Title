"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";


export default function Calendar() {
const sb = supabaseBrowser();
const [events, setEvents] = useState<any[]>([]);
useEffect(()=>{ (async()=>{
console.info('[Calendar] fetching events');
const { data, error } = await sb.from('calendar_events').select('title,start_time,end_time,is_client_visible').order('start_time', { ascending: true }).limit(50);
if (error) console.error('[Calendar] error', error);
console.info('[Calendar] fetched', (data||[]).length);
setEvents(data||[]);
})(); },[]);
return (
<div className="rounded-2xl border bg-card p-4 shadow-sm">
<h2 className="text-base font-semibold mb-2">Upcoming Events</h2>
<ul className="space-y-2 text-sm">
{events.map((e,i)=> (
<li key={i} className="rounded-xl border px-3 py-2">
<div className="font-medium">{e.title}</div>
<div className="text-xs text-muted-foreground">{new Date(e.start_time).toLocaleString()} → {e.end_time?new Date(e.end_time).toLocaleString():''} {e.is_client_visible?'(client-visible)':'(internal)'}</div>
</li>
))}
</ul>
</div>
);
}
