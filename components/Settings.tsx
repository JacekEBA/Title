"use client";
import { supabaseBrowser } from "@/lib/supabase/client";


export default function Settings() {
const sb = supabaseBrowser();
async function signOut() { console.log('[Settings] signOut start'); await sb.auth.signOut(); console.log('[Settings] signOut done'); location.href = '/login'; }
return (
<div className="rounded-2xl border bg-card p-4 shadow-sm">
<h2 className="text-base font-semibold">Settings</h2>
<button onClick={signOut} className="mt-3 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-accent/60">Sign out</button>
</div>
);
}
