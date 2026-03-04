const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                crypto: "node:crypto",
                http: "node:http",
                https: "node:https",
                util: "node:util",
                querystring: "node:querystring",
                url: "node:url",
                stream: "node:stream",
                buffer: "node:buffer",
                zlib: "node:zlib",
            };
        }
        return config;
    },
};

export default nextConfig;
