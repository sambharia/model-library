/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/models',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig

// Initialize Cloudflare adapter for local development
// This enables bindings during local development with `next dev`
// Only runs in development mode to avoid issues during production builds
if (process.env.NODE_ENV === 'development') {
  import("@opennextjs/cloudflare")
    .then(({ initOpenNextCloudflareForDev }) => {
      initOpenNextCloudflareForDev();
    })
    .catch(() => {
      // Silently fail if the module can't be loaded (e.g., incompatible Node version)
      console.log('Note: Cloudflare dev bindings not initialized (requires Node 20+)');
    });
}

