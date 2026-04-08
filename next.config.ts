import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wiki.project1999.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
