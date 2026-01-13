#!/bin/bash
# Script to find all TypeScript errors related to unused imports/variables

echo "Finding all TypeScript errors..."
cd "$(dirname "$0")"

# Run TypeScript compiler and extract all "is declared but its value is never read" errors
npx tsc --noEmit 2>&1 | grep -E "is declared but its value is never read" | \
  sed -E 's|^\./(.*):([0-9]+):([0-9]+):.*'\''([^'\'']+)'\''.*|\1:\2:\3:\4|' | \
  sort | uniq

echo ""
echo "Done! Format: file:line:column:variable"






