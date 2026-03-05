/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                "@prisma/client$": "@prisma/client/edge",
            };
        }
        return config;
    },
};

export default nextConfig;
