#!/bin/bash

# Clean Next.js and Turbo caches
# This script helps resolve "spawn EBADF" and other build cache issues

echo "🧹 Cleaning build caches..."

# Stop any running Next.js processes
echo "Stopping Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next build" 2>/dev/null || true

# Remove Next.js cache directories
echo "Removing .next directories..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove Turbo cache
echo "Removing Turbo cache..."
rm -rf .turbo 2>/dev/null || true
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove node_modules cache
echo "Removing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# Remove TypeScript build info
echo "Removing TypeScript build info..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Remove contentlayer cache
echo "Removing Contentlayer cache..."
find . -name ".contentlayer" -type d -exec rm -rf {} + 2>/dev/null || true

echo "✅ Cache cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: pnpm dev:web"
echo "2. If the issue persists, try: pnpm install"


