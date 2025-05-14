module.exports = function (api) {
    api.cache(true);

    // Check if we're in production mode
    const isProd = process.env.NODE_ENV === "production";

    return {
        presets: ["babel-preset-expo"],
        plugins: [
            "react-native-reanimated/plugin",
            "@babel/plugin-transform-runtime",
        ],
        env: {
            production: {
                plugins: ["transform-remove-console"],
            },
        },
    };
};
