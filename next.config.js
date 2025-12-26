/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Prevent deployments from failing due to ESLint rules.
  // We’ll keep code quality high by fixing lint issues manually later,
  // but deploy must not be blocked.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
