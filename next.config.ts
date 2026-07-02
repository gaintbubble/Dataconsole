import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This tells Vercel to ignore TypeScript errors during deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;