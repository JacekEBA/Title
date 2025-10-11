import { NextResponse } from 'next/server';
import { createSupabaseActionClient } from '@/lib/supabase/server';

// This file goes at: app/api/courses/[courseId]/route.ts

type Params = {
  params: {
    courseId: string;
  };
};

// GET - Fetch a single course
export async function GET(request: Request, { params }: Params) {
  try {
    const { courseId } = params;
    const supabase = createSupabaseActionClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this org
    const { data: membership } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('org_id', course.org_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PATCH - Update a course
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { name, timezone, phone, email, address_line1, city, region, postal_code } = body;

    if (!name || !timezone) {
      return NextResponse.json(
        { error: 'Course name and timezone are required' },
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

    // Get the course to check org_id
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('org_id')
      .eq('id', courseId)
      .single();

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this org
    const { data: membership } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('org_id', existingCourse.org_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update the course
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({
        name: name.trim(),
        timezone,
        phone: phone || null,
        email: email || null,
        address_line1: address_line1 || null,
        city: city || null,
        region: region || null,
        postal_code: postal_code || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating course:', updateError);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}
