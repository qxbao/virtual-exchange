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
    },
    devIndicators: false
};

export default nextConfig;
