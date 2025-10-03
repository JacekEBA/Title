"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";


export default function LoginPage() {
const [email, setEmail] = useState("");
const [loading, setLoading] = useState(false);
const [sent, setSent] = useState(false);
const supabase = supabaseBrowser();


useEffect(() => { console.log('[LoginPage] mounted'); }, []);


async function signIn(e: React.FormEvent) {
e.preventDefault();
setLoading(true);
console.log('[LoginPage.signIn] start', { email });
const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/app` } });
setLoading(false);
if (!error) {
console.log('[LoginPage.signIn] magic link sent');
setSent(true);
} else {
console.error('[LoginPage.signIn] error', error);
alert(error.message);
}
}


return (
<div className="min-h-screen grid place-items-center p-6">
<div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
<div className="flex items-center gap-2 mb-4">
<LogIn className="h-5 w-5" />
<h1 className="text-lg font-semibold">Sign in</h1>
</div>
{sent ? (
<p className="text-sm">Magic link sent to <b>{email}</b>. Check your inbox.</p>
) : (
<form onSubmit={signIn} className="space-y-3">
<input
type="email"
required
placeholder="you@example.com"
value={email}
onChange={(e) => { console.debug('[LoginPage] email change', e.target.value); setEmail(e.target.value); }}
className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
/>
}
