module.exports = function (api) {
    api.cache(true);

    // Check if we're in production mode
    const isProd = process.env.NODE_ENV === "production";

    return {
        presets: [
            [
                "babel-preset-expo",
                {
                    jsxImportSource: "react",
                    jsxRuntime: "automatic",
                },
            ],
        ],
        plugins: [
            "react-native-reanimated/plugin",
            [
                "@babel/plugin-transform-runtime",
                {
                    helpers: true,
                    regenerator: true,
                },
            ],
        ],
        env: {
            production: {
                plugins: ["transform-remove-console"],
            },
        },
    };
};
