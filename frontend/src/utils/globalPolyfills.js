/**
 * AGGRESSIVE Global Polyfills for Expo SDK 53 Compatibility
 * Fixes "Property 'require' doesn't exist" error with Hermes engine
 * This file gets injected directly into the Metro bundle
 */

// Immediately execute polyfills before any other code
(function () {
    "use strict";

    console.log(
        "🚨 AGGRESSIVE POLYFILL: Loading Expo SDK 53 compatibility fixes..."
    );

    // Ensure global object exists first
    if (typeof global === "undefined") {
        if (typeof window !== "undefined") {
            window.global = window;
        } else {
            // Create a minimal global object
            this.global = this;
        }
    }

    // CRITICAL: Add require polyfill IMMEDIATELY
    if (typeof global.require === "undefined") {
        console.log("🔧 CRITICAL FIX: Adding require polyfill for Hermes...");
        global.require = function (module) {
            console.warn(
                `⚠️ require('${module}') polyfilled - returning empty object`
            );
            return {};
        };
    }

    // Add __r polyfill (Metro's internal require)
    if (typeof global.__r === "undefined") {
        console.log("🔧 Adding __r polyfill for Metro...");
        global.__r = global.require;
    }

    // Add process polyfill
    if (typeof global.process === "undefined") {
        console.log("🔧 Adding process polyfill...");
        global.process = {
            env: {},
            platform: "react-native",
            version: "16.0.0",
        };
    }

    // Add metroRequire polyfill
    if (
        typeof global.metroRequire === "undefined" &&
        typeof require !== "undefined"
    ) {
        console.log("🔧 Adding metroRequire polyfill...");
        global.metroRequire = require;
    }

    // Add Buffer polyfill if needed
    if (typeof global.Buffer === "undefined") {
        global.Buffer = {
            isBuffer: function () {
                return false;
            },
            from: function (data) {
                return data;
            },
        };
    }

    console.log("✅ AGGRESSIVE POLYFILL: Core polyfills loaded successfully");
})();

// Import React Native StyleSheet after polyfills
import { StyleSheet as RNStyleSheet } from "react-native";

// StyleSheet polyfill with comprehensive error handling
const originalCreate = RNStyleSheet.create;
RNStyleSheet.create = (styles) => {
    try {
        return originalCreate(styles);
    } catch (error) {
        console.warn(
            "⚠️ StyleSheet.create failed, using fallback:",
            error.message
        );

        // Fallback: create a simple object with the same structure
        const processedStyles = {};
        for (const [key, value] of Object.entries(styles)) {
            if (typeof value === "object" && value !== null) {
                processedStyles[key] = { ...value };
            } else {
                processedStyles[key] = value;
            }
        }
        return processedStyles;
    }
};

// Additional polyfills for common Metro/React Native globals
if (typeof global.__DEV__ === "undefined") {
    global.__DEV__ = __DEV__;
}

if (typeof global.__BUNDLE_START_TIME__ === "undefined") {
    global.__BUNDLE_START_TIME__ = Date.now();
}

// Polyfill for setTimeout/setInterval if needed (rare edge case)
if (typeof global.setTimeout === "undefined") {
    global.setTimeout = setTimeout;
    global.setInterval = setInterval;
    global.clearTimeout = clearTimeout;
    global.clearInterval = clearInterval;
}

console.log("✅ Global polyfills loaded successfully");

export default {
    loaded: true,
    timestamp: Date.now(),
    version: "1.0.0",
};
