import { NextResponse } from 'next/server';
import { createSupabaseActionClient } from '@/lib/supabase/server';

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

    // Verify user is client_admin (should be automatic from trigger)
    if (existingProfile?.role !== 'client_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to create an organization' },
        { status: 403 }
      );
    }

    // Create organization - RLS policy allows client_admin to create
    const { data: org, error: orgError } = await supabase
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
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ org_id: org.id })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    // Create org membership
    const { error: membershipError } = await supabase
      .from('org_memberships')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'client_admin',
      });

    if (membershipError) {
      console.error('Failed to create org membership:', membershipError);
    }

    // Create courses
    const coursesToInsert = courses.map((courseName: string) => ({
      org_id: org.id,
      name: courseName,
      timezone: 'America/Chicago', // Default timezone
    }));

    const { error: coursesError } = await supabase
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
}import { NextResponse } from 'next/server';
import { createSupabaseActionClient } from '@/lib/supabase/server';

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

    // Verify user is client_admin (should be automatic from trigger)
    if (existingProfile?.role !== 'client_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to create an organization' },
        { status: 403 }
      );
    }

    // Create organization - RLS policy allows client_admin to create
    const { data: org, error: orgError } = await supabase
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
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ org_id: org.id })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    // Create org membership
    const { error: membershipError } = await supabase
      .from('org_memberships')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'client_admin',
      });

    if (membershipError) {
      console.error('Failed to create org membership:', membershipError);
    }

    // Create courses
    const coursesToInsert = courses.map((courseName: string) => ({
      org_id: org.id,
      name: courseName,
      timezone: 'America/Chicago', // Default timezone
    }));

    const { error: coursesError } = await supabase
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
