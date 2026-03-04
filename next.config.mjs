const nextConfig = {
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
            };
        }
        return config;
    },
};

export default nextConfig;
