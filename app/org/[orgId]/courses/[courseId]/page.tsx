import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireOrgAccess } from '@/lib/auth';
import Link from 'next/link';
import CourseDetailTabs from '@/components/CourseDetailTabs';

type Params = {
  params: {
    orgId: string;
    courseId: string;
  };
  searchParams: {
    tab?: string;
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
};

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  consent: string;
  created_at: string;
};

export default async function CourseDetailPage({ params, searchParams }: Params) {
  const { orgId, courseId } = params;
  const activeTab = searchParams.tab || 'overview';
  
  await requireOrgAccess(orgId);

  const supabase = createSupabaseServerClient();

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('org_id', orgId)
    .single();

  if (courseError || !course) {
    return (
      <div className="page">
        <div className="card">
          <p className="text-center py-12 text-muted-foreground">Course not found</p>
        </div>
      </div>
    );
  }

  const typedCourse = course as Course;

  // Fetch contacts for this course
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, phone, email, consent, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  const typedContacts = (contacts as Contact[] | null) ?? [];

  // Fetch recent imports
  const { data: imports } = await supabase
    .from('contact_imports')
    .select('id, status, rows_total, rows_inserted, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/org/${orgId}/courses`} className="btn">
          ← Back
        </Link>
        <h1 className="page-title">{typedCourse.name}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <Link
            href={`/org/${orgId}/courses/${courseId}?tab=overview`}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'overview'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </Link>
          <Link
            href={`/org/${orgId}/courses/${courseId}?tab=contacts`}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'contacts'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contacts ({typedContacts.length})
          </Link>
          <Link
            href={`/org/${orgId}/courses/${courseId}?tab=analytics`}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'analytics'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <CourseDetailTabs 
        activeTab={activeTab}
        course={typedCourse}
        contacts={typedContacts}
        imports={imports || []}
        orgId={orgId}
        courseId={courseId}
      />
    </div>
  );
}
