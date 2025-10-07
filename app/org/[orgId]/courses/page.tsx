import '../../../../styles/globals.css';
import { requireOrgAccess } from '../../../../lib/auth';

export default async function Page({ params }: { params: { orgId: string } }) {
  await requireOrgAccess(params.orgId);
  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href={`/org/${params.orgId}`}>
          Dashboard
        </a>
        <a className="btn" href={`/org/${params.orgId}/calendar`}>
          Calendar
        </a>
        <a className="btn btn-primary">Courses</a>
        <a className="btn" href={`/org/${params.orgId}/inbox`}>
          Inbox
        </a>
        <a className="btn" href={`/org/${params.orgId}/settings`}>
          Settings
        </a>
      </div>
      <div className="card">Coming soon</div>
    </div>
  );
}
