import { NextResponse } from 'next/server';
import { createSupabaseActionClient } from '@/lib/supabase/server';

// This file goes at: app/api/contacts/import/route.ts

// Helper function to validate E.164 phone format
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

// Helper function to normalize phone to E.164
function normalizePhone(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's likely US/Canada
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume US/Canada and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already looks like E.164
  if (phone.startsWith('+') && isValidE164(phone)) {
    return phone;
  }
  
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseActionClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orgId = formData.get('org_id') as string;
    const courseId = formData.get('course_id') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!orgId || !courseId) {
      return NextResponse.json(
        { error: 'org_id and course_id are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this org
    const { data: membership } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Read the CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const phoneIndex = header.findIndex(h => h === 'phone' || h === 'phone_number' || h === 'phonenumber');
    const nameIndex = header.findIndex(h => h === 'name' || h === 'full_name' || h === 'fullname');
    const emailIndex = header.findIndex(h => h === 'email' || h === 'email_address');
    const tagsIndex = header.findIndex(h => h === 'tags');

    if (phoneIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must have a "phone" column' },
        { status: 400 }
      );
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('contact_imports')
      .insert({
        org_id: orgId,
        course_id: courseId,
        storage_path: `imports/${file.name}`,
        status: 'processing',
        rows_total: lines.length - 1,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (importError || !importRecord) {
      return NextResponse.json(
        { error: 'Failed to create import record' },
        { status: 500 }
      );
    }

    // Parse and insert contacts
    let inserted = 0;
    let updated = 0;
    let ignored = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const rawPhone = values[phoneIndex] || '';
      const phone = normalizePhone(rawPhone);
      
      if (!phone || !isValidE164(phone)) {
        ignored++;
        continue;
      }

      const name = nameIndex >= 0 ? values[nameIndex] || null : null;
      const email = emailIndex >= 0 ? values[emailIndex] || null : null;
      const tagsStr = tagsIndex >= 0 ? values[tagsIndex] || '' : '';
      const tags = tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(Boolean) : [];

      // Try to insert, or update if exists
      const { error: upsertError } = await supabase
        .from('contacts')
        .upsert({
          org_id: orgId,
          course_id: courseId,
          phone,
          name,
          email,
          tags,
          source: 'csv_import',
          consent: 'unknown',
        }, {
          onConflict: 'org_id,phone',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('Error upserting contact:', upsertError);
        ignored++;
      } else {
        inserted++;
      }
    }

    // Update import record
    await supabase
      .from('contact_imports')
      .update({
        status: 'completed',
        rows_inserted: inserted,
        rows_updated: updated,
        rows_ignored: ignored,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importRecord.id);

    return NextResponse.json({
      success: true,
      import_id: importRecord.id,
      inserted,
      updated,
      ignored,
      total: lines.length - 1,
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}
