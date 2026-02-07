/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent Vercel deploy failures from lint rules.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
