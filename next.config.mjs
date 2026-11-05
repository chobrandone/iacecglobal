const remotePatterns = [];
if (process.env.S3_PUBLIC_URL) {
  const u = new URL(process.env.S3_PUBLIC_URL);
  remotePatterns.push({ protocol: u.protocol.replace(':', ''), hostname: u.hostname, pathname: `${u.pathname.replace(/\/$/, '')}/**` });
}

const dev = process.env.NODE_ENV !== 'production';

// Next.js needs inline scripts and styles unless every page is rendered per request.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' https:${dev ? ' ws:' : ''}`,
  'frame-src https://challenges.cloudflare.com https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/api/sponsorship/pdf/*': ['./public/media/brand/iacec-logo.png'],
    '/community-support/register/paper-form.pdf': ['./public/media/brand/iacec-logo.png'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
