import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "p99wiki.eqgeeks.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
