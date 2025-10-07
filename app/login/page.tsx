import '../../styles/globals.css';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { landingRedirectPath } from '../../lib/auth';

export default async function Page() {
  async function signIn(formData: FormData) {
    'use server';
    const supabase = createSupabaseServerClient();
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const path = await landingRedirectPath();
    redirect(path);
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '80px auto' }}>
        <h2>Sign in to Title</h2>
        <form action={signIn} style={{ display: 'grid', gap: 12 }}>
          <input className="input" name="email" placeholder="Email" type="email" required />
          <input className="input" name="password" placeholder="Password" type="password" required />
          <button className="btn btn-primary" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
