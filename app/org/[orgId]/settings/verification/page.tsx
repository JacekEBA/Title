// app/org/[orgId]/settings/verification/page.tsx
// This file already exists - here's the enhanced version with full functionality

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface BrandRequest {
  id: string;
  legal_name: string;
  dba: string;
  website: string;
  ein: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  status: string;
  decision_reason: string | null;
  provider_brand_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function RCSBrandVerificationPage({ params }: { params: { orgId: string } }) {
  const [existingRequest, setExistingRequest] = useState<BrandRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchExistingRequest();
  }, []);

  const fetchExistingRequest = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rcs_brand_verification_requests')
        .select('*')
        .eq('org_id', params.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error('Error fetching brand request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Insert brand verification request
      const { data: request, error: insertError } = await supabase
        .from('rcs_brand_verification_requests')
        .insert({
          org_id: params.orgId,
          submitted_by: user.id,
          legal_name: data.legal_name as string,
          dba: data.dba as string,
          website: data.website as string,
          ein: data.ein as string,
          address: data.address as string,
          contact_name: data.contact_name as string,
          contact_email: data.contact_email as string,
          contact_phone: data.contact_phone as string,
          notes: data.notes as string,
          status: 'submitted',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call API to submit to Pinnacle
      const response = await fetch('/api/pinnacle/brands/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          orgId: params.orgId,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit to Pinnacle');
      }

      const result = await response.json();

      // Update with provider brand ID if received
      if (result.brandId) {
        await supabase
          .from('rcs_brand_verification_requests')
          .update({ provider_brand_id: result.brandId })
          .eq('id', request.id);
      }

      // Create notification
      await supabase.from('notifications').insert({
        org_id: params.orgId,
        created_by: user.id,
        title: 'RCS Brand Verification Submitted',
        message: `Brand verification request for ${data.legal_name} has been submitted.`,
        type: 'brand_submitted',
        role_target: 'all',
        is_read: false,
        metadata: { request_id: request.id },
      });

      alert('Brand verification submitted successfully!');
      await fetchExistingRequest();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      alert(error.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">RCS Brand Verification</h1>
      <p className="text-muted-foreground mb-6">
        Submit your business information for RCS messaging verification through Pinnacle.
      </p>

      {/* Existing Request Status */}
      {existingRequest && (
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="section-title">Current Request Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(existingRequest.status)}`}>
              {existingRequest.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Legal Name</p>
              <p className="font-medium">{existingRequest.legal_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">DBA</p>
              <p className="font-medium">{existingRequest.dba || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Website</p>
              <p className="font-medium">{existingRequest.website}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {new Date(existingRequest.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {existingRequest.decision_reason && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-muted-foreground mb-1">Decision Reason</p>
              <p>{existingRequest.decision_reason}</p>
            </div>
          )}

          {existingRequest.status === 'approved' && existingRequest.provider_brand_id && (
            <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
              <p className="text-sm font-medium text-green-900">✅ Brand Verified</p>
              <p className="text-sm text-green-700 mt-1">
                Provider Brand ID: {existingRequest.provider_brand_id}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Form - show if no request or rejected */}
      {(!existingRequest || existingRequest.status === 'rejected') && (
        <div className="card">
          <h2 className="section-title mb-6">
            {existingRequest ? 'Resubmit Verification' : 'New Verification Request'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Legal Name <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="legal_name"
                  required
                  defaultValue={existingRequest?.legal_name}
                  placeholder="ABC Golf Corporation"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">DBA</span>
                <input
                  className="input"
                  name="dba"
                  defaultValue={existingRequest?.dba}
                  placeholder="ABC Golf Course"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Website <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="website"
                  type="url"
                  required
                  defaultValue={existingRequest?.website}
                  placeholder="https://example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  EIN <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="ein"
                  required
                  defaultValue={existingRequest?.ein}
                  placeholder="12-3456789"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium mb-1 block">
                Business Address <span className="text-red-500">*</span>
              </span>
              <textarea
                className="input"
                name="address"
                required
                rows={3}
                defaultValue={existingRequest?.address}
                placeholder="123 Main St, City, State ZIP"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Contact Name <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="contact_name"
                  required
                  defaultValue={existingRequest?.contact_name}
                  placeholder="John Doe"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Contact Email <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="contact_email"
                  type="email"
                  required
                  defaultValue={existingRequest?.contact_email}
                  placeholder="john@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium mb-1 block">
                  Contact Phone <span className="text-red-500">*</span>
                </span>
                <input
                  className="input"
                  name="contact_phone"
                  type="tel"
                  required
                  defaultValue={existingRequest?.contact_phone}
                  placeholder="+1234567890"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium mb-1 block">Additional Notes</span>
              <textarea
                className="input"
                name="notes"
                rows={4}
                defaultValue={existingRequest?.notes}
                placeholder="Any additional information..."
              />
            </label>

            <div className="flex justify-end gap-3">
              <Link href={`/org/${params.orgId}/settings`} className="btn">
                Cancel
              </Link>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
