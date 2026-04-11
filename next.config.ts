import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb', // allow card image uploads
    },
  },
};

export default nextConfig;
