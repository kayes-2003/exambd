/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@exambd/shared-types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};
module.exports = nextConfig;
