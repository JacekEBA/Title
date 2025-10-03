"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, BarChart3, Users, Filter, ChevronDown, Search, Building2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabaseBrowser } from "@/lib/supabase/client";
import { usd, getRollingWeekLabel } from "@/lib/utils";


type Org = { id: string; name: string; slug: string };
type Course = { id: string; name: string; org_id: string };
type WeekPoint = { label: string; sent: number };


function Badge({ children }: { children: React.ReactNode }) {
return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-muted/40">{children}</span>;
}


function StatCard({ title, value, icon, sub }: { title: string; value: string; icon: React.ReactNode; sub?: string }) {
return (
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl border bg-card p-5 shadow-sm">
<div className="flex items-center justify-between">
<div>
<p className="text-sm text-muted-foreground">{title}</p>
<p className="mt-1 text-2xl font-semibold">{value}</p>
{sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
</div>
<div className="rounded-xl border p-2.5 bg-muted/40">{icon}</div>
</div>
</motion.div>
);
}


export default function DashboardOverview() {
console.log('[DashboardOverview] render');
const supabase = supabaseBrowser();
const [orgs, setOrgs] = useState<Org[]>([]);
const [courses, setCourses] = useState<Course[]>([]);
const [clientId, setClientId] = useState<string | null>(null);
const [courseId, setCourseId] = useState<string>('all');
const [query, setQuery] = useState('');
const [isClientOpen, setIsClientOpen] = useState(false);
const [isCourseOpen, setIsCourseOpen] = useState(false);
const clientRef = useRef<HTMLDivElement | null>(null);
const courseRef = useRef<HTMLDivElement | null>(null);


useEffect(() => { console.log('[DashboardOverview] mounted'); }, []);


useEffect(() => {
const onDown = (e: MouseEvent) => {
const t = e.target as Node;
const closeClient = clientRef.current && !clientRef.current.contains(t);
const closeCourse = courseRef.current && !courseRef.current.contains(t);
if (closeClient) { console.debug('[DashboardOverview] outside click: closing org menu'); setIsClientOpen(false); }
if (closeCourse) { console.debug('[DashboardOverview] outside click: closing course menu'); setIsCourseOpen(false); }
};
document.addEventListener('mousedown', onDown);
return () => { document.removeEventListener('mousedown', onDown); };
}, []);


// Load orgs and courses (RLS restricts to user's org unless owner)
useEffect(() => {
(async () => {
console.info('[DashboardOverview] fetching organizations');
const { data: orgRows, error: orgErr } = await supabase.from('organizations').select('id,name,slug').order('name');
if (orgErr) console.error('[DashboardOverview] org fetch error', orgErr);
}
