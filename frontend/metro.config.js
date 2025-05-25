// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// AGGRESSIVE FIX for Expo SDK 53 StyleSheet error
// This completely disables the problematic package exports feature
config.resolver.unstable_enablePackageExports = false;

// Add comprehensive file extension support
config.resolver.sourceExts = ["jsx", "js", "ts", "tsx", "json", "cjs", "mjs"];
config.resolver.assetExts = [
    "png",
    "jpg",
    "jpeg",
    "svg",
    "gif",
    "webp",
    "ttf",
    "otf",
    "woff",
    "woff2",
];

// Ensure proper module resolution
config.resolver.platforms = ["native", "android", "ios", "web"];

// Force JSC engine (disable Hermes completely)
config.transformer.hermesCommand = "";
config.transformer.enableHermes = false;

// Enhanced module resolution with fallbacks
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Add custom polyfills to the bundle
config.serializer.getPolyfills = () => [
    require.resolve("./src/utils/globalPolyfills.js"),
];

// Disable minification in development for better debugging
if (process.env.NODE_ENV !== "production") {
    config.transformer.minifierConfig = {
        keep_fnames: true,
        mangle: {
            keep_fnames: true,
        },
    };
}

module.exports = config;
