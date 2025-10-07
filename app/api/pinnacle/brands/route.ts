import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase/server';

const API_BASE = 'https://api.pinnacle.sh';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_id, request_id } = body ?? {};
  if (!org_id || !request_id) {
    return NextResponse.json({ error: 'missing parameters' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const requestRow = await admin
    .from('rcs_brand_verification_requests')
    .select('*')
    .eq('id', request_id)
    .single();
  if (requestRow.error || !requestRow.data) {
    return NextResponse.json({ error: 'request not found' }, { status: 404 });
  }

  const response = await fetch(`${API_BASE}/brands`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PINNACLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      legal_name: requestRow.data.legal_name,
      dba: requestRow.data.dba,
      website: requestRow.data.website,
      ein: requestRow.data.ein,
      address: requestRow.data.address,
      contact: {
        name: requestRow.data.contact_name,
        email: requestRow.data.contact_email,
        phone: requestRow.data.contact_phone,
      },
    }),
  });
  if (!response.ok) {
    return NextResponse.json({ error: await response.text() }, { status: 400 });
  }
  const brand = await response.json();

  await admin
    .from('org_integrations')
    .upsert({ org_id, provider: 'pinnacle', brand_id: brand.id }, { onConflict: 'org_id,provider' });
  await admin
    .from('rcs_brand_verification_requests')
    .update({ provider_brand_id: brand.id, status: 'in_review' })
    .eq('id', request_id);

  return NextResponse.json({ ok: true, brand_id: brand.id });
}
