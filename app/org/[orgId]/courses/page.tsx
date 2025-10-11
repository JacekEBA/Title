import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireOrgAccess } from '@/lib/auth';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Courses',
};

type Params = {
  params: {
    orgId: string;
  };
};

type Course = {
  id: string;
  name: string;
  timezone: string;
  city: string | null;
  region: string | null;
  created_at: string;
};

export default async function OrgCoursesPage({ params }: Params) {
  const { orgId } = params;
  
  // Verify access
  await requireOrgAccess(orgId);

  // Fetch courses for this organization
  const supabase = createSupabaseServerClient();
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, name, timezone, city, region, created_at')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching courses:', error);
  }

  const typedCourses = (courses as Course[] | null) ?? [];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Courses</h1>
        {typedCourses.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {typedCourses.length} {typedCourses.length === 1 ? 'course' : 'courses'}
          </div>
        )}
      </div>

      {typedCourses.length === 0 ? (
        <div className="card">
          <p className="text-muted-foreground text-center py-12">
            No courses found. Contact your agency administrator to add courses.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {typedCourses.map((course) => (
            <Link 
              key={course.id} 
              href={`/org/${orgId}/courses/${course.id}`}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {course.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {course.city && course.region 
                        ? `${course.city}, ${course.region}`
                        : course.city || course.region || 'Location not set'
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.timezone.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
