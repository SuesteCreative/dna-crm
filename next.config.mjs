const nextConfig = {
    transpilePackages: ["next-auth", "openid-client", "oauth"],
    experimental: {
        serverComponentsExternalPackages: ["next-auth", "openid-client", "oauth"],
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                crypto: false,
                http: false,
                https: false,
                util: false,
                querystring: false,
                url: false,
                stream: false,
                buffer: false,
                zlib: false,
            };
        }
        return config;
    },
};

export default nextConfig;
