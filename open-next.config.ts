import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Enable streaming responses for better performance
  streaming: true,
  
  // Configure the cache behavior
  cache: {
    // Cache static assets
    default: {
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 86400, // 1 day
    },
    // Don't cache HTML pages
    html: {
      maxAge: 0,
      staleWhileRevalidate: 0,
    },
    // Cache images
    images: {
      maxAge: 31536000,
      staleWhileRevalidate: 86400,
    },
    // Cache JSON responses for 5 minutes
    json: {
      maxAge: 300,
      staleWhileRevalidate: 60,
    },
  },

  // Middleware configuration
  middleware: {
    // Paths to exclude from middleware
    exclude: ['/_next/static/*', '/_next/image*', '/favicon.ico'],
  },

  // Transform configuration for edge runtime compatibility
  transform: {
    // Include Node.js polyfills needed by the app
    polyfills: {
      stream: true,
      crypto: true,
      buffer: true,
      process: true,
    },
  },
});