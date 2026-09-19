/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@whiskeysockets/baileys", "pino"],
  },
};
module.exports = nextConfig;
