/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  // Configure image optimization for Clerk and Stream.io
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '**.stream-io-video.com',
      },
      {
        protocol: 'https',
        hostname: 'stream-io-video.s3.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
