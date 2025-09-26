import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
    outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },
};

export default nextConfig;
