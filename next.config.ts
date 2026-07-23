import type { NextConfig } from 'next';

const accountsEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim(),
);

const clerkScriptSources = accountsEnabled
  ? ' https://*.clerk.accounts.dev https://challenges.cloudflare.com'
  : '';

const scriptSources = process.env.NODE_ENV === 'development'
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'${clerkScriptSources}`
  : `script-src 'self' 'unsafe-inline'${clerkScriptSources}`;

const connectSources = accountsEnabled
  ? "connect-src 'self' https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.clerk-telemetry.com"
  : "connect-src 'self'";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSources,
              "style-src 'self' 'unsafe-inline'",
              accountsEnabled ? "img-src 'self' blob: data: https://img.clerk.com" : "img-src 'self' blob: data:",
              "font-src 'self' data:",
              connectSources,
              accountsEnabled
                ? "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com"
                : "frame-src https://www.youtube-nocookie.com",
              "worker-src 'self' blob:",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
