/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    // If this is the admin deployment, redirect / to /admin
    if (process.env.NEXT_PUBLIC_ADMIN_MODE === 'true') {
      return [
        {
          source: '/',
          destination: '/admin',
          permanent: false,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;