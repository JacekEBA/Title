import crypto from 'crypto';
import { createSupabaseAdminClient } from './supabase/server';

const API_BASE = 'https://api.pinnacle.sh';

export function verifyPinnacleSignature(rawBody: string, signature?: string | null) {
  if (!signature) return false;
  const secret = process.env.PINNACLE_SIGNING_SECRET!;
  const h = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function sendRcsMessage(params: {
  orgId: string;
  toPhoneE164: string;
  payload: any;
}) {
  const admin = createSupabaseAdminClient();
  const integ = await admin
    .from('org_integrations')
    .select('brand_id, agent_id, phone_number')
    .eq('org_id', params.orgId)
    .maybeSingle();
  if (integ.error) throw integ.error;
  if (!integ.data?.brand_id || !integ.data?.agent_id) {
    throw new Error('Org is missing Pinnacle brand or agent configuration');
  }

  const res = await fetch(`${API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PINNACLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: params.toPhoneE164,
      brand_id: integ.data?.brand_id ?? undefined,
      agent_id: integ.data?.agent_id ?? undefined,
      payload: params.payload,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Pinnacle send failed: ${res.status} ${await res.text()}`
    );
  }
  return res.json();
}
