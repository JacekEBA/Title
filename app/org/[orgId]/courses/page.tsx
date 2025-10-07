import { requireOrgAccess } from '@/lib/auth';
import OrgNav from '@/components/OrgNav';

type Params = {
  params: {
    orgId: string;
  };
};

export default async function OrgCoursesPage({ params }: Params) {
  await requireOrgAccess(params.orgId);

  return (
    <div className="container">
      <OrgNav orgId={params.orgId} currentPath="courses" />

      <h1 className="text-2xl font-bold mb-6">Courses</h1>

      <div className="card">
        <p className="text-muted-foreground text-center py-12">
          Course management coming soon. Contact your agency administrator to
          manage courses.
        </p>
      </div>
    </div>
  );
}
