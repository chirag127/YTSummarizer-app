# StyleSheet Error Troubleshooting Guide

## Problem
ReferenceError: Property 'StyleSheet' doesn't exist - React Native Hermes engine issue

## Solutions Applied ✅

### 1. Disabled New Architecture
- Changed `newArchEnabled: false` in `app.json`
- New Architecture (Fabric) can cause module loading issues

### 2. Removed Babel Plugin
- Removed `@babel/plugin-transform-runtime` from `babel.config.js`
- This plugin conflicts with Hermes engine

### 3. Cleared Caches
- Cleared Metro bundler cache
- Cleared Expo cache

## Additional Solutions (If Still Having Issues)

### Solution 4: Downgrade React Native
If the error persists, consider downgrading to a more stable version:

```bash
npm install react-native@0.72.6
npx expo install --fix
```

### Solution 5: Disable Hermes Engine
Add to `metro.config.js`:

```javascript
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Disable Hermes
config.transformer.hermesCommand = "";

module.exports = config;
```

### Solution 6: Check for Circular Dependencies
Run dependency analysis:

```bash
npx madge --circular --extensions js,jsx,ts,tsx src/
```

### Solution 7: Reset Node Modules
Complete reset:

```bash
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### Solution 8: Alternative Metro Config
Replace `metro.config.js` with:

```javascript
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ["jsx", "js", "ts", "tsx", "json"];
config.resolver.assetExts = ["png", "jpg", "jpeg", "svg", "gif", "webp"];

// Ensure proper module resolution
config.resolver.platforms = ["native", "android", "ios", "web"];

module.exports = config;
```

## Testing Steps

1. Scan QR code with Expo Go
2. Check for StyleSheet error
3. If error persists, try solutions 4-8 in order
4. Report which solution works

## Common Causes

- New Architecture compatibility issues
- Babel plugin conflicts
- Hermes engine module loading
- Circular dependencies
- Metro bundler cache corruption
- React Native version incompatibilities
