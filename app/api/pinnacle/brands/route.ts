import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const API_BASE = 'https://api.pinnacle.sh';

export const runtime = 'nodejs';

type BrandValidateRequest = {
  action: 'validate';
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
};

type BrandSubmitRequest = {
  action: 'submit';
  org_id: string;
  request_id: string;
};

type BrandRequest = BrandValidateRequest | BrandSubmitRequest;

type PinnacleContactInfo = {
  name: string;
  email: string;
  phone: string;
  title?: string;
};

type PinnacleBrandPayload = {
  name: string;
  website: string;
  email: string;
  address: string;
  sector: string;
  type: string;
  contact: PinnacleContactInfo;
  ein?: string;
  dba?: string;
  description?: string;
};

type PinnacleBrandResponse = {
  id: number;
  status: string;
  [key: string]: any;
};

export async function POST(req: NextRequest) {
  try {
    const body: BrandRequest = await req.json();
    const { action } = body;

    // Check for API key
    const apiKey = process.env.PINNACLE_API_KEY;
    if (!apiKey) {
      console.error('PINNACLE_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Handle validation action
    if (action === 'validate') {
      const validateBody = body as BrandValidateRequest;
      
      const pinnaclePayload: PinnacleBrandPayload = {
        name: validateBody.name,
        website: validateBody.website,
        email: validateBody.email,
        address: validateBody.address,
        sector: validateBody.sector,
        type: validateBody.type,
        contact: validateBody.contact,
      };

      if (validateBody.ein) pinnaclePayload.ein = validateBody.ein;
      if (validateBody.dba) pinnaclePayload.dba = validateBody.dba;
      if (validateBody.description) pinnaclePayload.description = validateBody.description;

      // Call Pinnacle validation endpoint
      const response = await fetch(`${API_BASE}/brands/validate`, {
        method: 'POST',
        headers: {
          'PINNACLE-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pinnaclePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinnacle validation error:', errorText);
        return NextResponse.json(
          {
            error: 'Brand validation failed',
            details: errorText,
          },
          { status: response.status }
        );
      }

      const validation = await response.json();
      
      return NextResponse.json({
        ok: true,
        validation,
      });
    }

    // Handle submit action
    if (action === 'submit') {
      const submitBody = body as BrandSubmitRequest;
      const { org_id, request_id } = submitBody;

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

      // Prepare Pinnacle API payload for brand creation
      const pinnaclePayload: PinnacleBrandPayload = {
        name: requestRow.legal_name,
        website: requestRow.website,
        email: requestRow.contact_email,
        address: requestRow.address,
        sector: 'HOSPITALITY', // Default for golf courses
        type: 'PRIVATE_PROFIT', // Default
        contact: {
          name: requestRow.contact_name,
          email: requestRow.contact_email,
          phone: requestRow.contact_phone,
          title: 'Contact',
        },
      };

      if (requestRow.ein) pinnaclePayload.ein = requestRow.ein;
      if (requestRow.dba) pinnaclePayload.dba = requestRow.dba;
      if (requestRow.notes) pinnaclePayload.description = requestRow.notes;

      // Step 1: Validate brand info
      const validateResponse = await fetch(`${API_BASE}/brands/validate`, {
        method: 'POST',
        headers: {
          'PINNACLE-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pinnaclePayload),
      });

      if (!validateResponse.ok) {
        const errorText = await validateResponse.text();
        console.error('Pinnacle validation error:', errorText);
        return NextResponse.json(
          {
            error: 'Brand validation failed',
            details: errorText,
          },
          { status: validateResponse.status }
        );
      }

      const validation = await validateResponse.json();
      
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: 'Brand validation failed',
            errors: validation.errors,
          },
          { status: 400 }
        );
      }

      // Step 2: Create/update brand
      const createResponse = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: {
          'PINNACLE-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pinnaclePayload),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Pinnacle brand creation error:', errorText);
        return NextResponse.json(
          {
            error: 'Failed to create brand with Pinnacle',
            details: errorText,
          },
          { status: createResponse.status }
        );
      }

      const brand: PinnacleBrandResponse = await createResponse.json();

      // Step 3: Submit brand for verification
      const submitResponse = await fetch(`${API_BASE}/brands/${brand.id}/submit`, {
        method: 'POST',
        headers: {
          'PINNACLE-API-KEY': apiKey,
        },
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Pinnacle brand submission error:', errorText);
        return NextResponse.json(
          {
            error: 'Failed to submit brand for verification',
            details: errorText,
          },
          { status: submitResponse.status }
        );
      }

      // Step 4: Update database
      await admin
        .from('org_integrations')
        .upsert(
          {
            org_id,
            provider: 'pinnacle',
            brand_id: brand.id.toString(),
            status: 'pending',
          },
          { onConflict: 'org_id,provider' }
        );

      // Update verification request
      await admin
        .from('rcs_brand_verification_requests')
        .update({
          provider_brand_id: brand.id.toString(),
          status: 'in_review',
        })
        .eq('id', request_id);

      return NextResponse.json({
        ok: true,
        brand_id: brand.id,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "validate" or "submit"' },
      { status: 400 }
    );
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
