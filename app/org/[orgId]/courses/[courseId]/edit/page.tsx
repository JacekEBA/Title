'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Params = {
  params: {
    orgId: string;
    courseId: string;
  };
};

interface CourseData {
  name: string;
  timezone: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  region: string;
  postal_code: string;
}

export default function EditCoursePage({ params }: Params) {
  const router = useRouter();
  const { orgId, courseId } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseData>({
    name: '',
    timezone: 'America/Chicago',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    region: '',
    postal_code: '',
  });

  useEffect(() => {
    async function fetchCourse() {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        
        const data = await response.json();
        setCourse({
          name: data.name || '',
          timezone: data.timezone || 'America/Chicago',
          phone: data.phone || '',
          email: data.email || '',
          address_line1: data.address_line1 || '',
          city: data.city || '',
          region: data.region || '',
          postal_code: data.postal_code || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!course.name.trim()) {
      setError('Course name is required');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: course.name.trim(),
          timezone: course.timezone,
          phone: course.phone.trim() || null,
          email: course.email.trim() || null,
          address_line1: course.address_line1.trim() || null,
          city: course.city.trim() || null,
          region: course.region.trim() || null,
          postal_code: course.postal_code.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update course');
      }

      router.push(`/org/${orgId}/courses`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setSaving(false);
    }
  };

  const updateField = (field: keyof CourseData, value: string) => {
    setCourse(prev => ({ ...prev, [field]: value }));
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
  ];

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p className="text-center py-12 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/org/${orgId}/courses`} className="btn">
          ← Back
        </Link>
        <h1 className="page-title">Edit Course</h1>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} className="form-grid">
          {/* Course Name */}
          <label className="block">
            <span className="text-sm font-medium mb-1 block">
              Course Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={course.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Course name"
              required
              className="input"
              disabled={saving}
            />
          </label>

          {/* Timezone */}
          <label className="block">
            <span className="text-sm font-medium mb-1 block">
              Timezone <span className="text-red-500">*</span>
            </span>
            <select
              value={course.timezone}
              onChange={e => updateField('timezone', e.target.value)}
              className="input"
              disabled={saving}
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Phone</span>
              <input
                type="tel"
                value={course.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="+1234567890"
                className="input"
                disabled={saving}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Email</span>
              <input
                type="email"
                value={course.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="info@course.com"
                className="input"
                disabled={saving}
              />
            </label>
          </div>

          {/* Address */}
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Address</span>
            <input
              type="text"
              value={course.address_line1}
              onChange={e => updateField('address_line1', e.target.value)}
              placeholder="Street address"
              className="input"
              disabled={saving}
            />
          </label>

          {/* City, State, Zip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">City</span>
              <input
                type="text"
                value={course.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="City"
                className="input"
                disabled={saving}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium mb-1 block">State</span>
              <input
                type="text"
                value={course.region}
                onChange={e => updateField('region', e.target.value)}
                placeholder="State"
                className="input"
                disabled={saving}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Zip</span>
              <input
                type="text"
                value={course.postal_code}
                onChange={e => updateField('postal_code', e.target.value)}
                placeholder="Zip"
                className="input"
                disabled={saving}
              />
            </label>
          </div>

          {error && (
            <div className="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href={`/org/${orgId}/courses`} className="btn">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
