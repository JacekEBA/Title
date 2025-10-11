'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CourseForm {
  id: string;
  name: string;
  timezone: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  region: string;
  postal_code: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [courses, setCourses] = useState<CourseForm[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      timezone: 'America/Chicago',
      phone: '',
      email: '',
      address_line1: '',
      city: '',
      region: '',
      postal_code: '',
    },
  ]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!orgName.trim()) {
      setError('Please enter your organization name');
      setLoading(false);
      return;
    }

    const validCourses = courses.filter(c => c.name.trim().length > 0);

    if (validCourses.length === 0) {
      setError('Please add at least one course');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: orgName,
          courses: validCourses.map(c => ({
            name: c.name.trim(),
            timezone: c.timezone,
            phone: c.phone.trim() || null,
            email: c.email.trim() || null,
            address_line1: c.address_line1.trim() || null,
            city: c.city.trim() || null,
            region: c.region.trim() || null,
            postal_code: c.postal_code.trim() || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      router.push(`/org/${result.org_id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        id: crypto.randomUUID(),
        name: '',
        timezone: 'America/Chicago',
        phone: '',
        email: '',
        address_line1: '',
        city: '',
        region: '',
        postal_code: '',
      },
    ]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof CourseForm, value: string) => {
    setCourses(
      courses.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
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

  return (
    <main className="login-bg">
      <div className="auth-wrap">
        <div className="brand">
          <div className="flag" />
          <span>Title</span>
        </div>
        <div className="auth-card" style={{ maxWidth: '700px' }}>
          <h1 className="headline">Welcome to Title! 🏌️</h1>
          <p className="subtext">
            Let's set up your organization and add your golf courses.
          </p>

          <form onSubmit={handleSubmit} className="form-grid">
            {/* Organization Name */}
            <label className="block">
              <span className="text-sm font-medium mb-1 block">
                Organization Name <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g., Pebble Beach Golf Links"
                required
                className="input"
                disabled={loading}
              />
            </label>

            {/* Courses Section */}
            <div className="block">
              <span className="text-sm font-medium mb-2 block">
                Golf Courses <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-muted-foreground mb-3">
                Add at least one course. You can add more later.
              </p>

              <div className="space-y-4">
                {courses.map((course, index) => (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-gray-700">
                        Course {index + 1}
                      </h3>
                      {courses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCourse(course.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Course Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Course Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={course.name}
                          onChange={e =>
                            updateCourse(course.id, 'name', e.target.value)
                          }
                          placeholder={`Course ${index + 1} name`}
                          className="input"
                          disabled={loading}
                        />
                      </div>

                      {/* Show additional fields only if course name is entered */}
                      {course.name.trim().length > 0 && (
                        <>
                          {/* Timezone */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Timezone <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={course.timezone}
                              onChange={e =>
                                updateCourse(course.id, 'timezone', e.target.value)
                              }
                              className="input"
                              disabled={loading}
                            >
                              {timezones.map(tz => (
                                <option key={tz} value={tz}>
                                  {tz.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Contact Info Row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={course.phone}
                                onChange={e =>
                                  updateCourse(course.id, 'phone', e.target.value)
                                }
                                placeholder="+1234567890"
                                className="input"
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                value={course.email}
                                onChange={e =>
                                  updateCourse(course.id, 'email', e.target.value)
                                }
                                placeholder="info@course.com"
                                className="input"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Address */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <input
                              type="text"
                              value={course.address_line1}
                              onChange={e =>
                                updateCourse(
                                  course.id,
                                  'address_line1',
                                  e.target.value
                                )
                              }
                              placeholder="Street address"
                              className="input"
                              disabled={loading}
                            />
                          </div>

                          {/* City, State, Zip */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                City
                              </label>
                              <input
                                type="text"
                                value={course.city}
                                onChange={e =>
                                  updateCourse(course.id, 'city', e.target.value)
                                }
                                placeholder="City"
                                className="input"
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                State
                              </label>
                              <input
                                type="text"
                                value={course.region}
                                onChange={e =>
                                  updateCourse(course.id, 'region', e.target.value)
                                }
                                placeholder="State"
                                className="input"
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Zip
                              </label>
                              <input
                                type="text"
                                value={course.postal_code}
                                onChange={e =>
                                  updateCourse(
                                    course.id,
                                    'postal_code',
                                    e.target.value
                                  )
                                }
                                placeholder="Zip"
                                className="input"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCourse}
                  className="btn w-full"
                  disabled={loading}
                >
                  + Add Another Course
                </button>
              </div>
            </div>

            {error && (
              <div className="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
