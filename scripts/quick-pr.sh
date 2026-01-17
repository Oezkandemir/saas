#!/bin/bash

# Quick PR Script - Erstellt schnell einen Feature-Branch und PR
# Usage: ./scripts/quick-pr.sh "branch-name" "Commit message"

set -e

BRANCH_NAME=$1
COMMIT_MSG=$2

if [ -z "$BRANCH_NAME" ] || [ -z "$COMMIT_MSG" ]; then
  echo "❌ Usage: ./scripts/quick-pr.sh <branch-name> <commit-message>"
  echo ""
  echo "Example:"
  echo "  ./scripts/quick-pr.sh feature/add-button \"feat: Add new button\""
  exit 1
fi

echo "🚀 Creating feature branch and PR..."
echo ""

# Check if we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Warning: You're not on main branch. Current branch: $CURRENT_BRANCH"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Update main
echo "📥 Updating main branch..."
git checkout main
git pull origin main

# Create feature branch
echo "🌿 Creating feature branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
  echo "📝 Staging and committing changes..."
  git add .
  git commit -m "$COMMIT_MSG"
else
  echo "⚠️  No changes to commit. Did you forget to make changes?"
  exit 1
fi

# Push branch
echo "📤 Pushing branch to origin..."
git push origin "$BRANCH_NAME"

# Create PR
echo "🔀 Creating pull request..."
gh pr create --title "$COMMIT_MSG" --body "Automatically created PR for: $COMMIT_MSG" --fill

echo ""
echo "✅ Done! Pull request created:"
echo "   https://github.com/Oezkandemir/saas/pulls"
