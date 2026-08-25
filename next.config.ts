import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "3005",
    pathname: "/uploads/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "3005",
    pathname: "/uploads/**",
  },
  {
    protocol: "https",
    hostname: "*.r2.dev",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "imagedelivery.net",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "res.cloudinary.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "*.cloudinary.com",
    pathname: "/**",
  },
];

const mediaUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
if (mediaUrl) {
  try {
    const parsed = new URL(mediaUrl);
    remotePatterns.push({
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      pathname: "/**",
    });
  } catch {
    /* ignore */
  }
}

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
