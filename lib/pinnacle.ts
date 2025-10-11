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

/**
 * Check if a phone number supports RCS
 */
export async function checkRcsCapability(phoneNumber: string): Promise<boolean> {
  try {
    // URL encode the phone number (replace + with %2B)
    const encodedPhone = encodeURIComponent(phoneNumber);
    
    const res = await fetch(`${API_BASE}/status/phone-number/${encodedPhone}`, {
      method: 'GET',
      headers: {
        'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
      },
    });

    if (!res.ok) {
      console.warn(`Failed to check RCS capability for ${phoneNumber}: ${res.status}`);
      return false;
    }

    const data = await res.json();
    // Return true if phone number status is ACTIVE
    return data.status === 'ACTIVE';
  } catch (error) {
    console.error('Error checking RCS capability:', error);
    return false;
  }
}

/**
 * Send an RCS message via Pinnacle
 */
export async function sendRcsMessage(params: {
  orgId: string;
  toPhoneE164: string;
  payload: any; // Can be text, cards, or media message
}) {
  const admin = createSupabaseAdminClient() as any;
  
  // Get org integration details
  const integ = await admin
    .from('org_integrations')
    .select('brand_id, agent_id, phone_number')
    .eq('org_id', params.orgId)
    .eq('provider', 'pinnacle')
    .maybeSingle();
    
  if (integ.error) throw integ.error;
  
  if (!integ.data?.phone_number) {
    throw new Error('Org is missing Pinnacle phone number configuration');
  }

  // Build request body based on Pinnacle API docs
  const requestBody: any = {
    from: integ.data.phone_number, // Your Pinnacle phone number or agent ID
    to: params.toPhoneE164,
  };

  // Handle different message types based on payload structure
  if (params.payload.text) {
    // Text message
    requestBody.text = params.payload.text;
    requestBody.quickReplies = params.payload.quickReplies || [];
  } else if (params.payload.cards) {
    // Rich card carousel
    requestBody.cards = params.payload.cards;
    requestBody.quickReplies = params.payload.quickReplies || [];
  } else if (params.payload.media) {
    // Media message
    requestBody.media = params.payload.media;
    requestBody.quickReplies = params.payload.quickReplies || [];
  } else {
    throw new Error('Invalid payload: must contain text, cards, or media');
  }

  // Add options if provided
  if (params.payload.options) {
    requestBody.options = params.payload.options;
  }

  const res = await fetch(`${API_BASE}/messages/send/rcs`, {
    method: 'POST',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Pinnacle send failed: ${res.status} ${errorText}`
    );
  }

  return res.json();
}

/**
 * Send a regular SMS message (fallback when RCS not supported)
 */
export async function sendSmsMessage(params: {
  orgId: string;
  toPhoneE164: string;
  text: string;
}) {
  const admin = createSupabaseAdminClient() as any;
  
  const integ = await admin
    .from('org_integrations')
    .select('phone_number')
    .eq('org_id', params.orgId)
    .eq('provider', 'pinnacle')
    .maybeSingle();
    
  if (integ.error) throw integ.error;
  
  if (!integ.data?.phone_number) {
    throw new Error('Org is missing Pinnacle phone number configuration');
  }

  const res = await fetch(`${API_BASE}/messages/send/sms`, {
    method: 'POST',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: integ.data.phone_number,
      to: params.toPhoneE164,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Pinnacle SMS send failed: ${res.status} ${errorText}`
    );
  }

  return res.json();
}

/**
 * Batch check RCS capability for multiple contacts
 */
export async function batchCheckRcsCapability(
  phoneNumbers: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // Check in parallel with rate limiting (max 5 concurrent)
  const chunks = [];
  for (let i = 0; i < phoneNumbers.length; i += 5) {
    chunks.push(phoneNumbers.slice(i, i + 5));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (phone) => {
      const capable = await checkRcsCapability(phone);
      results.set(phone, capable);
    });
    await Promise.all(promises);
  }
  
  return results;
}

// lib/pinnacle.ts additions

/**
 * Create or update a brand for RCS verification
 */
export async function createOrUpdateBrand(params: {
  brandId?: number;
  orgId: string;
  name: string;
  website: string;
  email: string;
  ein?: string;
  address: string;
  sector: string;
  type: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    title?: string;
  };
  dba?: string;
  description?: string;
}) {
  const body: any = {
    name: params.name,
    website: params.website,
    email: params.email,
    address: params.address,
    sector: params.sector,
    type: params.type,
    contact: params.contact,
  };

  if (params.brandId) body.id = params.brandId;
  if (params.ein) body.ein = params.ein;
  if (params.dba) body.dba = params.dba;
  if (params.description) body.description = params.description;

  const res = await fetch(`${API_BASE}/brands`, {
    method: 'POST',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Brand upsert failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Submit brand for verification
 */
export async function submitBrandForVerification(brandId: number) {
  const res = await fetch(`${API_BASE}/brands/${brandId}/submit`, {
    method: 'POST',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
    },
  });

  if (!res.ok) {
    throw new Error(`Brand submission failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Validate brand information before submission
 */
export async function validateBrandInfo(params: {
  name: string;
  website: string;
  email: string;
  address: string;
  sector: string;
  type: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  ein?: string;
  dba?: string;
  description?: string;
}) {
  const res = await fetch(`${API_BASE}/brands/validate`, {
    method: 'POST',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Brand validation failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Get brand status from Pinnacle
 */
export async function getBrandStatus(brandId: number) {
  const res = await fetch(`${API_BASE}/status/brand/${brandId}`, {
    method: 'GET',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
    },
  });

  if (!res.ok) {
    throw new Error(`Get brand status failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Get phone number status
 */
export async function getPhoneNumberStatus(phoneNumber: string) {
  const encoded = encodeURIComponent(phoneNumber);
  const res = await fetch(`${API_BASE}/status/phone-number/${encoded}`, {
    method: 'GET',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
    },
  });

  if (!res.ok) {
    throw new Error(`Get phone status failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/**
 * Get RCS capabilities for multiple phone numbers
 */
export async function getRcsCapabilities(phoneNumbers: string[]) {
  const res = await fetch(`${API_BASE}/rcs/capabilities`, {
    method: 'POST',
    headers: {
      'PINNACLE-API-KEY': process.env.PINNACLE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumbers }),
  });

  if (!res.ok) {
    throw new Error(`Get RCS capabilities failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
