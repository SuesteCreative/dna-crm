const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["next-auth", "openid-client", "oauth"],
    },
    webpack: (config, { isServer, webpack }) => {
        if (isServer) {
            config.plugins.push(
                new webpack.NormalModuleReplacementPlugin(
                    /^(crypto|http|https|util|querystring|url|stream|buffer|zlib)$/,
                    (resource) => {
                        if (!resource.request.startsWith("node:")) {
                            resource.request = `node:${resource.request}`;
                        }
                    }
                )
            );

            config.externals.push(({ request }, callback) => {
                if (/^node:/.test(request)) {
                    return callback(null, `module ${request}`);
                }
                callback();
            });
        }
        return config;
    },
};

export default nextConfig;
