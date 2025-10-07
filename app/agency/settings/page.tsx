import '../../../styles/globals.css';

export default function Page() {
  return (
    <div className="container">
      <div className="tabbar">
        <a className="btn" href="/agency/calendar">
          Calendar
        </a>
        <a className="btn" href="/agency/clients">
          Clients
        </a>
        <a className="btn" href="/agency/analytics">
          Analytics
        </a>
        <a className="btn" href="/agency/inbox">
          Inbox
        </a>
        <a className="btn btn-primary">Settings</a>
      </div>
      <div className="card">Coming soon</div>
    </div>
  );
}
