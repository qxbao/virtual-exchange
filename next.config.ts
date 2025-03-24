import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "bin.bnbstatic.com",
                port: '',

            }
        ]
    }
};

export default nextConfig;
