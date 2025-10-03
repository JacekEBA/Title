"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";


export default function AdminPanel() {
const sb = supabaseBrowser();
const [orgs, setOrgs] = useState<any[]>([]);
const [courses, setCourses] = useState<any[]>([]);
const [templates, setTemplates] = useState<any[]>([]);
const [form, setForm] = useState({ org_id: '', course_id: '', template_id: '', name: 'Promo', when: '' });


useEffect(() => {
console.log('[AdminPanel] mounted');
(async () => {
const { data: o, error: oErr } = await sb.from('organizations').select('id,name').order('name');
if (oErr) console.error('[AdminPanel] orgs error', oErr);
setOrgs(o || []);
console.info('[AdminPanel] orgs loaded', (o||[]).length);
const { data: c, error: cErr } = await sb.from('courses').select('id,name,org_id').order('name');
if (cErr) console.error('[AdminPanel] courses error', cErr);
setCourses(c || []);
console.info('[AdminPanel] courses loaded', (c||[]).length);
const { data: t, error: tErr } = await sb.from('rcs_templates').select('id,name,org_id').order('updated_at', { ascending: false });
if (tErr) console.error('[AdminPanel] templates error', tErr);
setTemplates(t || []);
console.info('[AdminPanel] templates loaded', (t||[]).length);
})();
}, []);


const scopedCourses = courses.filter((c) => !form.org_id || c.org_id === form.org_id);
const scopedTemplates = templates.filter((t) => !form.org_id || t.org_id === form.org_id);


async function createCampaign(e: React.FormEvent) {
e.preventDefault();
console.log('[AdminPanel.createCampaign] submit', form);
const tz = 'America/New_York';
const when = new Date(form.when || Date.now()).toISOString();
const { error } = await sb.from('campaigns').insert({
org_id: form.org_id,
course_id: form.course_id,
template_id: form.template_id,
name: form.name,
timezone: tz,
audience_kind: 'all_contacts',
scheduled_at: when,
status: 'scheduled',
client_visible: true,
}
