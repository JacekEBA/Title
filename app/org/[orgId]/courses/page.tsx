import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireOrgAccess } from '@/lib/auth';
import type { Metadata } from 'next';

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
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
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
    .select('id, name, timezone, phone, email, address_line1, city, region, postal_code, country, created_at')
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
            <div key={course.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {course.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.timezone.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Information */}
                {(course.phone || course.email) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Contact</h3>
                    <div className="space-y-1">
                      {course.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {course.phone}
                        </div>
                      )}
                      {course.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {course.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Address */}
                {course.address_line1 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Address</h3>
                    <div className="text-sm text-gray-600">
                      <div>{course.address_line1}</div>
                      {(course.city || course.region || course.postal_code) && (
                        <div>
                          {course.city && `${course.city}, `}
                          {course.region && `${course.region} `}
                          {course.postal_code}
                        </div>
                      )}
                      {course.country && course.country !== 'US' && (
                        <div>{course.country}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!course.phone && !course.email && !course.address_line1 && (
                <div className="text-sm text-muted-foreground italic">
                  No additional details available
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
