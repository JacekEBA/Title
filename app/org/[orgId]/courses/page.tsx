import { requireOrgAccess } from '@/lib/auth';
import OrgNav from '@/components/OrgNav';

type Params = {
  params: {
    orgId: string;
  };
};

export default async function OrgCalendarPage({ params }: Params) {
  return (
    <div className="page">
      <h1 className="page-title">Calendar</h1>

      <div className="card">
        <p className="text-muted-foreground text-center py-12">
          Calendar view coming soon. You can schedule campaigns from the Agency
          Calendar for now.
        </p>
      </div>
    </div>
  );
}
