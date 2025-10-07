import { redirect } from 'next/navigation';
import { requireOrgAccess } from '@/lib/auth';
import { createSupabaseActionClient } from '@/lib/supabase/server';
import OrgNav from '@/components/OrgNav';

type Params = {
  params: {
    orgId: string;
  };
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export default async function VerificationPage({ params }: Params) {
  await requireOrgAccess(params.orgId);

  async function submitVerification(formData: FormData) {
    'use server';

    const supa = createSupabaseActionClient();
    const fields = Object.fromEntries(formData.entries());

    // Get current user
    const {
      data: { user },
    } = await supa.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Insert verification request
    const { data: request, error: insertError } = await supa
      .from('rcs_brand_verification_requests')
      .insert({
        org_id: String(fields.org_id),
        submitted_by: user.id,
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

    if (insertError) {
      throw new Error(insertError.message || 'Failed to create verification request');
    }

    // Call Pinnacle API
    const response = await fetch(`${getBaseUrl()}/api/pinnacle/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: String(fields.org_id),
        request_id: request.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit to Pinnacle: ${errorText}`);
    }

    redirect(`/org/${fields.org_id}/settings`);
  }

  return (
    <div className="container">
      <OrgNav orgId={params.orgId} currentPath="settings" />

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Verify RCS Brand</h1>
        <p className="text-muted-foreground mb-6">
          Submit your business information for RCS brand verification. This
          process typically takes 3-5 business days.
        </p>

        <div className="card">
          <form action={submitVerification} className="space-y-6">
            <input type="hidden" name="org_id" value={params.orgId} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Legal Name <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="legal_name"
                  required
                  placeholder="ABC Golf Corporation"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">DBA</span>
                <input
                  className="input"
                  name="dba"
                  placeholder="ABC Golf Course"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Website <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="website"
                  type="url"
                  required
                  placeholder="https://example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  EIN <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="ein"
                  required
                  placeholder="12-3456789"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium mb-1 block">
                Business Address <span className="text-red-500">*</span>
              </span>
              <textarea
                className="input"
                name="address"
                required
                rows={3}
                placeholder="123 Main St, City, State ZIP"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Contact Name <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="contact_name"
                  required
                  placeholder="John Doe"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Contact Email <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="contact_email"
                  type="email"
                  required
                  placeholder="john@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Contact Phone <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="contact_phone"
                  type="tel"
                  required
                  placeholder="+1234567890"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium mb-1 block">
                Additional Notes
              </span>
              <textarea
                className="input"
                name="notes"
                rows={4}
                placeholder="Any additional information that might be helpful..."
              />
            </label>

            <div className="flex justify-end gap-3">
              <a href={`/org/${params.orgId}/settings`} className="btn">
                Cancel
              </a>
              <button type="submit" className="btn btn-primary">
                Submit for Verification
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
