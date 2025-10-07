import '../../../../../styles/globals.css';
import { redirect } from 'next/navigation';
import { requireOrgAccess } from '../../../../../lib/auth';
import { createSupabaseActionClient } from '../../../../../lib/supabase/server';

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export default async function Page({ params }: { params: { orgId: string } }) {
  await requireOrgAccess(params.orgId);

  async function submit(formData: FormData) {
    'use server';
    const supa = createSupabaseActionClient();
    const fields = Object.fromEntries(formData.entries());
    const { data: userData } = await supa.auth.getUser();
    const ins = await supa
      .from('rcs_brand_verification_requests')
      .insert({
        org_id: String(fields.org_id),
        submitted_by: userData.user?.id ?? null,
        legal_name: String(fields.legal_name || ''),
        dba: String(fields.dba || ''),
        website: String(fields.website || ''),
        ein: String(fields.ein || ''),
        address: String(fields.address || ''),
        contact_name: String(fields.contact_name || ''),
        contact_email: String(fields.contact_email || ''),
        contact_phone: String(fields.contact_phone || ''),
        notes: String(fields.notes || ''),
      })
      .select('id')
      .single();
    if (ins.error) throw ins.error;

    const res = await fetch(`${getBaseUrl()}/api/pinnacle/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: String(fields.org_id), request_id: ins.data.id }),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }

    redirect(`/org/${fields.org_id}/settings`);
  }

  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href={`/org/${params.orgId}`}>
          Dashboard
        </a>
        <a className="btn" href={`/org/${params.orgId}/calendar`}>
          Calendar
        </a>
        <a className="btn" href={`/org/${params.orgId}/courses`}>
          Courses
        </a>
        <a className="btn" href={`/org/${params.orgId}/inbox`}>
          Inbox
        </a>
        <a className="btn btn-primary" href={`/org/${params.orgId}/settings`}>
          Settings
        </a>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <h2>Verify RCS Brand</h2>
        <form action={submit} style={{ display: 'grid', gap: 10 }}>
          <input type="hidden" name="org_id" value={params.orgId} />
          <div className="row">
            <div className="col">
              <label>
                Legal name
                <input className="input" name="legal_name" />
              </label>
            </div>
            <div className="col">
              <label>
                DBA
                <input className="input" name="dba" />
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label>
                Website
                <input className="input" name="website" />
              </label>
            </div>
            <div className="col">
              <label>
                EIN
                <input className="input" name="ein" />
              </label>
            </div>
          </div>
          <label>
            Address
            <textarea className="input" name="address" />
          </label>
          <div className="row">
            <div className="col">
              <label>
                Contact name
                <input className="input" name="contact_name" />
              </label>
            </div>
            <div className="col">
              <label>
                Contact email
                <input className="input" type="email" name="contact_email" />
              </label>
            </div>
            <div className="col">
              <label>
                Contact phone
                <input className="input" name="contact_phone" />
              </label>
            </div>
          </div>
          <label>
            Notes
            <textarea className="input" name="notes" />
          </label>
          <button className="btn btn-primary" type="submit">
            Submit for verification
          </button>
        </form>
      </div>
    </div>
  );
}
