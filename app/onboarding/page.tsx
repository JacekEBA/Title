'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<string[]>(['']);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const orgName = String(formData.get('org_name') ?? '').trim();
    
    // Get all course names (filter out empty ones)
    const courseNames = courses
      .map((_, i) => String(formData.get(`course_${i}`) ?? '').trim())
      .filter(name => name.length > 0);

    if (!orgName) {
      setError('Please enter your organization name');
      setLoading(false);
      return;
    }

    if (courseNames.length === 0) {
      setError('Please add at least one course');
      setLoading(false);
      return;
    }

    try {
      // Call the server action to create org and courses
      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: orgName,
          courses: courseNames,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      // Redirect to the new org dashboard
      router.push(`/org/${result.org_id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const addCourse = () => {
    setCourses([...courses, '']);
  };

  const removeCourse = (index: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index));
    }
  };

  return (
    <main className="login-bg">
      <div className="auth-wrap">
        <div className="brand">
          <div className="flag" />
          <span>Title</span>
        </div>
        <div className="auth-card" style={{ maxWidth: '600px' }}>
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
                name="org_name"
                type="text"
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

              {courses.map((_, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    name={`course_${index}`}
                    type="text"
                    placeholder={`Course ${index + 1} name`}
                    className="input flex-1"
                    disabled={loading}
                  />
                  {courses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCourse(index)}
                      className="btn"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addCourse}
                className="btn w-full mt-2"
                disabled={loading}
              >
                + Add Another Course
              </button>
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
