/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    }
  },
  images: {
    remotePatterns: [],
  },
  output: 'standalone',
};

export default nextConfig;
