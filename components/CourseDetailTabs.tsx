'use client';

import Link from 'next/link';
import { useState } from 'react';

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

type Import = {
  id: string;
  status: string;
  rows_total: number | null;
  rows_inserted: number | null;
  created_at: string;
};

type Props = {
  activeTab: string;
  course: Course;
  contacts: Contact[];
  imports: Import[];
  orgId: string;
  courseId: string;
};

export default function CourseDetailTabs({ activeTab, course, contacts, imports, orgId, courseId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('course_id', courseId);
      formData.append('org_id', orgId);

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Reload the page to show new contacts
      window.location.reload();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
      setUploading(false);
    }
  };

  if (activeTab === 'overview') {
    return (
      <div className="space-y-6">
        {/* Course Info Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Course Information</h2>
            <Link href={`/org/${orgId}/courses/${courseId}/edit`} className="btn text-sm">
              Edit
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Timezone</dt>
                  <dd className="text-sm">{course.timezone.replace(/_/g, ' ')}</dd>
                </div>
              </dl>
            </div>

            {(course.phone || course.email) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Contact</h3>
                <dl className="space-y-2">
                  {course.phone && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd className="text-sm">{course.phone}</dd>
                    </div>
                  )}
                  {course.email && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="text-sm">{course.email}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {course.address_line1 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>
                <div className="text-sm text-gray-600">
                  <div>{course.address_line1}</div>
                  {(course.city || course.region || course.postal_code) && (
                    <div>
                      {course.city && `${course.city}, `}
                      {course.region && `${course.region} `}
                      {course.postal_code}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-2xl font-bold text-gray-900">{contacts.length}</div>
            <div className="text-sm text-muted-foreground">Total Contacts</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.consent === 'opted_in').length}
            </div>
            <div className="text-sm text-muted-foreground">Opted In</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-gray-900">{imports.length}</div>
            <div className="text-sm text-muted-foreground">Imports</div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'contacts') {
    return (
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Import Contacts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with your contacts. Required columns: phone (E.164 format). Optional: name, email, tags.
          </p>
          
          <div className="flex items-center gap-4">
            <label className="btn-primary cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? 'Uploading...' : 'Choose CSV File'}
            </label>
            {uploadError && (
              <div className="text-sm text-red-600">{uploadError}</div>
            )}
          </div>

          {imports.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Recent Imports</h3>
              <div className="space-y-2">
                {imports.map(imp => (
                  <div key={imp.id} className="flex items-center justify-between text-sm py-2 border-b">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        imp.status === 'completed' ? 'bg-green-100 text-green-700' :
                        imp.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {imp.status}
                      </span>
                      <span className="text-muted-foreground">
                        {imp.rows_inserted || 0} of {imp.rows_total || 0} contacts
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(imp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">All Contacts</h2>
          
          {contacts.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No contacts yet. Upload a CSV to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Consent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(contact => (
                    <tr key={contact.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{contact.name || '—'}</td>
                      <td className="py-3 px-4 text-sm font-mono">{contact.phone}</td>
                      <td className="py-3 px-4 text-sm">{contact.email || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.consent === 'opted_in' ? 'bg-green-100 text-green-700' :
                          contact.consent === 'opted_out' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {contact.consent}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Analytics</h2>
        <p className="text-center py-12 text-muted-foreground">
          Course analytics coming soon. This will show campaign performance, engagement rates, and more.
        </p>
      </div>
    );
  }

  return null;
}
