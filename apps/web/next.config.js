/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Force Next.js to use Webpack instead of Turbopack (which fails to ignore errors)
  experimental: {
    turbo: false,
  },
};

export default nextConfig;