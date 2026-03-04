const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["next-auth", "openid-client", "oauth", "@prisma/client"],
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
                net: false,
                tls: false,
                fs: false,
            };
        }
        return config;
    },
};

export default nextConfig;
