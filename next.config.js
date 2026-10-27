/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Both ship native binaries. Leaving them out of the webpack bundle keeps
    // the .node files on disk where Node can require them at runtime.
    serverComponentsExternalPackages: ['@node-rs/argon2', '@prisma/client'],
  },
};

module.exports = nextConfig;
