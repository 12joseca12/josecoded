import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  redirects: () => Promise.resolve([{ source: "/", destination: "/es", permanent: false }]),
};

export default nextConfig;
