/** @type {import('next').NextConfig} */
const publicSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const publicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY;

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  env: {
    ...(publicSupabaseUrl && { NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl }),
    ...(publicSupabaseAnonKey && {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnonKey,
    }),
  },
};

export default nextConfig
