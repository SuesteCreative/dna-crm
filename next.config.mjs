/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                crypto: "node:crypto",
                http: "node:http",
                https: "node:https",
                querystring: "node:querystring",
                zlib: "node:zlib",
                stream: "node:stream",
                buffer: "node:buffer",
                util: "node:util",
            };
        }
        return config;
    },
};

export default nextConfig;
