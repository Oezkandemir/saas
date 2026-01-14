#!/bin/bash

# Clear all Next.js/Turbopack caches
echo "🧹 Clearing all caches..."

# Remove Next.js build cache
rm -rf .next

# Remove Turbopack cache
rm -rf .turbo

# Remove node_modules cache
rm -rf node_modules/.cache

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo

# Remove any other build artifacts
find . -name "*.tsbuildinfo" -delete 2>/dev/null

echo "✅ All caches cleared!"
echo ""
echo "📝 Next steps:"
echo "1. Stop your dev server (Ctrl+C)"
echo "2. Run: pnpm dev"
echo ""
