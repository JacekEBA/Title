import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const API_BASE = 'https://api.pinnacle.sh';

export const runtime = 'nodejs';

type BrandRequest = {
  org_id: string;
  request_id: string;
};

type PinnacleContactInfo = {
  name: string;
  email: string;
  phone: string;
};

type PinnacleBrandPayload = {
  legal_name: string;
  dba: string;
  website: string;
  ein: string;
  address: string;
  contact: PinnacleContactInfo;
};

type PinnacleBrandResponse = {
  id: string;
  [key: string]: any;
};

export async function POST(req: NextRequest) {
  try {
    const body: BrandRequest = await req.json();
    const { org_id, request_id } = body;

    // Validate request
    if (!org_id || !request_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: org_id and request_id' },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient() as any;

    // Get verification request
    const { data: requestRow, error: requestError } = await admin
      .from('rcs_brand_verification_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !requestRow) {
      console.error('Verification request not found:', requestError);
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (
      !requestRow.legal_name ||
      !requestRow.website ||
      !requestRow.ein ||
      !requestRow.address ||
      !requestRow.contact_name ||
      !requestRow.contact_email ||
      !requestRow.contact_phone
    ) {
      return NextResponse.json(
        { error: 'Missing required verification information' },
        { status: 400 }
      );
    }

    // Prepare Pinnacle API payload
    const pinnaclePayload: PinnacleBrandPayload = {
      legal_name: requestRow.legal_name,
      dba: requestRow.dba ?? '',
      website: requestRow.website,
      ein: requestRow.ein,
      address: requestRow.address,
      contact: {
        name: requestRow.contact_name,
        email: requestRow.contact_email,
        phone: requestRow.contact_phone,
      },
    };

    // Check for API key
    const apiKey = process.env.PINNACLE_API_KEY;
    if (!apiKey) {
      console.error('PINNACLE_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Submit to Pinnacle
    const response = await fetch(`${API_BASE}/brands`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinnaclePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinnacle API error:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to submit brand verification to Pinnacle',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const brand: PinnacleBrandResponse = await response.json();

    // Update org_integrations
    await admin
      .from('org_integrations')
      .upsert(
        {
          org_id,
          provider: 'pinnacle',
          brand_id: brand.id,
        },
        { onConflict: 'org_id,provider' }
      );

    // Update verification request
    await admin
      .from('rcs_brand_verification_requests')
      .update({
        provider_brand_id: brand.id,
        status: 'in_review',
      })
      .eq('id', request_id);

    return NextResponse.json({
      ok: true,
      brand_id: brand.id,
    });
  } catch (error) {
    console.error('Brand verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
