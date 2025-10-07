import '../../../styles/globals.css';
import { fetchOwnerOrgs } from '../../../lib/queries';

export default async function Page() {
  const orgs = await fetchOwnerOrgs();
  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href="/agency/calendar">
          Calendar
        </a>
        <a className="btn btn-primary">Clients</a>
        <a className="btn" href="/agency/analytics">
          Analytics
        </a>
        <a className="btn" href="/agency/inbox">
          Inbox
        </a>
        <a className="btn" href="/agency/settings">
          Settings
        </a>
      </div>
      <h2>Clients</h2>
      <div className="row">
        {(orgs ?? []).map((org) => (
          <div key={org.id} className="card col">
            <h3>{org.name}</h3>
            <a className="btn btn-primary" href={`/org/${org.id}`}>
              Open dashboard
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
