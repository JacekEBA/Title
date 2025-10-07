import { requireOrgAccess } from '@/lib/auth';
import OrgNav from '@/components/OrgNav';

type Params = {
  params: {
    orgId: string;
  };
};

export default async function OrgCalendarPage({ params }: Params) {
  await requireOrgAccess(params.orgId);

  return (
    <div className="container">
      <OrgNav orgId={params.orgId} currentPath="calendar" />

      <h1 className="text-2xl font-bold mb-6">Calendar</h1>

      <div className="card">
        <p className="text-muted-foreground text-center py-12">
          Calendar view coming soon. You can schedule campaigns from the Agency
          Calendar for now.
        </p>
      </div>
    </div>
  );
}
