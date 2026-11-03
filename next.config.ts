import type { NextConfig } from "next";

// Team photography is served from Supabase Storage; allow the optimizer to fetch from it.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  // Admin forms upload images through server actions (validated: ≤ 8 MB each, ≤ 12 per save).
  experimental: { serverActions: { bodySizeLimit: "100mb" } },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabase
      ? [{ protocol: supabase.protocol.replace(":", "") as "http" | "https", hostname: supabase.hostname, port: supabase.port, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
