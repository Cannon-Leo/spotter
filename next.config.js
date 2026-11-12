/** @type {import('next').NextConfig} */
const nextConfig = {
  // Both ship native binaries. Leaving them out of the webpack bundle keeps
  // the .node files on disk where Node can require them at runtime.
  serverExternalPackages: ['@node-rs/argon2', '@prisma/client'],
};

module.exports = nextConfig;
