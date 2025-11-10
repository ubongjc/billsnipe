import type { NextConfig } from "next";
import createPWA from '@ducanh2912/next-pwa'

const withPWA = createPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: 'sw.js',
  cacheOnNavigation: true,
})

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
};

export default withPWA(nextConfig);
