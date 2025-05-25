# Complete Project Reset Script for StyleSheet Error
# Run this script if the error persists

Write-Host "🔄 Starting complete project reset..." -ForegroundColor Yellow

# Stop any running Metro processes
Write-Host "🛑 Stopping Metro processes..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" } | Stop-Process -Force

# Remove all cache directories
Write-Host "🗑️ Removing cache directories..." -ForegroundColor Blue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force %TEMP%\metro-* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force %TEMP%\react-* -ErrorAction SilentlyContinue

# Remove node_modules and package-lock.json
Write-Host "📦 Removing node_modules and package-lock.json..." -ForegroundColor Blue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force

# Reinstall dependencies
Write-Host "📥 Reinstalling dependencies..." -ForegroundColor Green
npm install

# Fix Expo dependencies
Write-Host "🔧 Fixing Expo dependencies..." -ForegroundColor Green
npx expo install --fix

# Start with clean cache
Write-Host "🚀 Starting Expo with clean cache..." -ForegroundColor Green
npx expo start --clear --reset-cache

Write-Host "✅ Reset complete! Test the app now." -ForegroundColor Green
