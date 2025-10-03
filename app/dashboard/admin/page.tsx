import { supabaseServer } from "@/lib/supabase/server";
import AdminPanel from "@/components/AdminPanel";


export default async function AdminPage() {
const supabase = supabaseServer();
const { data: { user } } = await supabase.auth.getUser();
console.info('[AdminPage] user', { hasUser: !!user, id: user?.id });
if (!user) return null;
const { data: me, error } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
if (error) console.error('[AdminPage] profile error', error);
console.info('[AdminPage] role', me?.role);
if (me?.role !== 'owner') { return null; }
return <AdminPanel/>;
}
