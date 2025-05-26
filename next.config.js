/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Désactiver optimizations qui causent des problèmes
  experimental: {
    optimizeCss: false, // Désactivé temporairement
  },
  // Configuration simplifiée
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configuration webpack simplifiée
  webpack: (config, { dev, isServer }) => {
    return config;
  },
};

module.exports = nextConfig;
