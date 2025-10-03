"use client";
import { createClient } from "@supabase/supabase-js";
export const supabaseBrowser = () => {
console.info('[supabaseBrowser] creating client', {
url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'MISSING',
key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'MISSING',
});
return createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{ auth: { persistSession: true, autoRefreshToken: true } }
);
};
