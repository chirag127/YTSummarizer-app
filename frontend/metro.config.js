// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add additional file extensions to be processed by Metro
config.resolver.sourceExts = ["jsx", "js", "ts", "tsx", "json"];

module.exports = config;
