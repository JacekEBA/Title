import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createSupabaseServerClient } from './supabase/server';
import type { Profile, UserRole } from './types';

/**
 * Get the current session, cached per request
 */
export const getSession = cache(async () => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  
  return data.session;
});

/**
 * Get the current user's profile, cached per request
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const session = await getSession();
  if (!session) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, org_id, role, full_name, timezone, phone')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
});

/**
 * Check if user has global owner or agency_staff role
 */
export async function isAgencyUser(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === 'owner' || profile?.role === 'agency_staff';
}

/**
 * Check if user has access to a specific organization
 */
export async function hasOrgAccess(orgId: string): Promise<boolean> {
  // Agency users have access to all orgs
  if (await isAgencyUser()) {
    return true;
  }

  // Check if user has membership in this org
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('org_memberships')
    .select('id')
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('Error checking org access:', error);
    return false;
  }

  return !!data;
}

/**
 * Require org access or redirect to dashboard
 */
export async function requireOrgAccess(orgId: string): Promise<void> {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const hasAccess = await hasOrgAccess(orgId);
  
  if (!hasAccess) {
    redirect('/dashboard?error=no_access');
  }
}

/**
 * Require agency role or redirect
 */
export async function requireAgencyAccess(): Promise<void> {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const isAgency = await isAgencyUser();
  
  if (!isAgency) {
    redirect('/dashboard?error=agency_only');
  }
}

/**
 * Determine where to redirect user based on their role and memberships
 */
export async function landingRedirectPath(): Promise<string> {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    return '/dashboard';
  }

  // Agency users go to agency dashboard
  if (profile.role === 'owner' || profile.role === 'agency_staff') {
    return '/agency';
  }

  // Get user's org memberships
  const supabase = createSupabaseServerClient();
  const { data: memberships } = await supabase
    .from('org_memberships')
    .select('org_id')
    .order('created_at', { ascending: true });

  // If exactly one org, redirect there
  if (memberships && memberships.length === 1) {
    return `/org/${memberships[0].org_id}`;
  }

  // Otherwise, show org chooser
  return '/dashboard';
}

/**
 * Require specific role(s)
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const profile = await getCurrentProfile();
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/dashboard?error=insufficient_permissions');
  }

  return profile;
}
