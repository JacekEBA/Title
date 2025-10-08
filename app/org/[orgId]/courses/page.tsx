import { requireOrgAccess } from '@/lib/auth';
import OrgNav from '@/components/OrgNav';

type Params = {
  params: {
    orgId: string;
  };
};

export default async function OrgCoursesPage({ params }: Params) {
  return (
    <div className="page">
      <h1 className="page-title">Courses</h1>

      <div className="card">
        <p className="text-muted-foreground text-center py-12">
          Course management coming soon. Contact your agency administrator to
          manage courses.
        </p>
      </div>
    </div>
  );
}
