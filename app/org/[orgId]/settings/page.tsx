import Link from 'next/link';

type Params = {
  params: {
    orgId: string;
  };
};

export default async function OrgSettingsPage({ params }: Params) {
  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <h2 className="section-title">RCS Brand Verification</h2>
          <p className="text-muted-foreground mb-4">
            Verify your brand to send RCS messages to customers.
          </p>
          <Link
            href={`/org/${params.orgId}/settings/verification`}
            className="btn btn-primary"
          >
            Start Verification Process
          </Link>
        </div>

        <div className="card">
          <h2 className="section-title">Organization Details</h2>
          <p className="text-muted-foreground">
            Contact your agency administrator to update organization settings.
          </p>
        </div>
      </div>
    </div>
  );
}
