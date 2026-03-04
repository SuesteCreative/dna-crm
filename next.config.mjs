/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                crypto: false,
                http: false,
                https: false,
                querystring: false,
                zlib: false,
                stream: false,
                buffer: false,
                util: false,
            };
        }
        return config;
    },
};

export default nextConfig;
