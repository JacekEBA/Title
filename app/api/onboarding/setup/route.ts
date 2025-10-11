import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseActionClient, createSupabaseAdminClient, getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

interface CourseInput {
  name: string;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  address_line1?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
}

export async function POST(request: Request) {
  try {
    const { org_name, courses } = await request.json();

    if (!org_name || !courses || courses.length === 0) {
      return NextResponse.json(
        { error: 'Organization name and at least one course are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseActionClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user already has an org
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfile?.org_id) {
      return NextResponse.json(
        { error: 'You already have an organization' },
        { status: 400 }
      );
    }

    // Verify user is client_admin
    if (existingProfile?.role !== 'client_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to create an organization' },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS for initial setup
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const supabaseUrl = getSupabaseUrl();

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseAdminClient(serviceRoleKey, supabaseUrl) as any;
    
    // Create organization
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: org_name,
        slug: org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })
      .select('id')
      .single();

    if (orgError || !org) {
      console.error('Failed to create organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Update profile with org_id
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ org_id: org.id })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    // Create org membership
    const { error: membershipError } = await adminClient
      .from('org_memberships')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'client_admin',
      });

    if (membershipError) {
      console.error('Failed to create org membership:', membershipError);
    }

    // Create courses with all the new fields
    const coursesToInsert = courses.map((course: CourseInput) => ({
      org_id: org.id,
      name: course.name,
      timezone: course.timezone || 'America/Chicago',
      phone: course.phone || null,
      email: course.email || null,
      address_line1: course.address_line1 || null,
      city: course.city || null,
      region: course.region || null,
      postal_code: course.postal_code || null,
      country: 'US',
    }));

    const { error: coursesError } = await adminClient
      .from('courses')
      .insert(coursesToInsert);

    if (coursesError) {
      console.error('Failed to create courses:', coursesError);
      return NextResponse.json(
        { error: 'Organization created but failed to add courses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      org_id: org.id,
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
