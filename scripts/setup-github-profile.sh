#!/bin/bash

# Script to set up GitHub Profile README
# This will create the repository and upload the README

set -e

REPO_NAME="Oezkandemir"
GITHUB_USER="Oezkandemir"

echo "🎨 Setting up GitHub Profile README..."
echo ""

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "Please run: gh auth login"
    exit 1
fi

# Check if repository already exists
if gh repo view "$GITHUB_USER/$REPO_NAME" &>/dev/null; then
    echo "✅ Repository $GITHUB_USER/$REPO_NAME already exists"
    echo "📝 Updating README..."
    
    # Update existing README
    gh repo view "$GITHUB_USER/$REPO_NAME" --json defaultBranchRef --jq .defaultBranchRef.name > /dev/null
    DEFAULT_BRANCH=$(gh repo view "$GITHUB_USER/$REPO_NAME" --json defaultBranchRef --jq .defaultBranchRef.name)
    
    # Get current README SHA if it exists
    README_SHA=$(gh api repos/$GITHUB_USER/$REPO_NAME/contents/README.md --jq .sha 2>/dev/null || echo "")
    
    # Read the README content
    README_CONTENT=$(cat "$(dirname "$0")/../GITHUB_PROFILE_README.md" | base64)
    
    # Create JSON for API call
    if [ -n "$README_SHA" ]; then
        # Update existing file
        gh api repos/$GITHUB_USER/$REPO_NAME/contents/README.md \
          --method PUT \
          --field message="Update profile README" \
          --field content="$README_CONTENT" \
          --field sha="$README_SHA" \
          --field branch="$DEFAULT_BRANCH"
    else
        # Create new file
        gh api repos/$GITHUB_USER/$REPO_NAME/contents/README.md \
          --method PUT \
          --field message="Add profile README" \
          --field content="$README_CONTENT" \
          --field branch="$DEFAULT_BRANCH"
    fi
    
    echo "✅ README updated successfully!"
else
    echo "📦 Creating new repository: $GITHUB_USER/$REPO_NAME"
    
    # Create repository
    gh repo create "$REPO_NAME" \
      --public \
      --description "GitHub Profile README" \
      --clone=false
    
    echo "✅ Repository created!"
    echo ""
    echo "📝 Now uploading README..."
    
    # Wait a moment for GitHub to process
    sleep 2
    
    # Get default branch
    DEFAULT_BRANCH=$(gh repo view "$GITHUB_USER/$REPO_NAME" --json defaultBranchRef --jq .defaultBranchRef.name)
    
    # Read and encode README
    README_CONTENT=$(cat "$(dirname "$0")/../GITHUB_PROFILE_README.md" | base64)
    
    # Upload README
    gh api repos/$GITHUB_USER/$REPO_NAME/contents/README.md \
      --method PUT \
      --field message="Add profile README" \
      --field content="$README_CONTENT" \
      --field branch="$DEFAULT_BRANCH"
    
    echo "✅ README uploaded successfully!"
fi

echo ""
echo "🎉 GitHub Profile README is now live!"
echo ""
echo "📱 View your profile: https://github.com/$GITHUB_USER"
echo "📝 Edit README: https://github.com/$GITHUB_USER/$REPO_NAME/edit/$DEFAULT_BRANCH/README.md"
echo ""
echo "💡 Tips:"
echo "   - The README will appear on your GitHub profile automatically"
echo "   - You can edit it directly on GitHub or via this script"
echo "   - Stats update automatically from your GitHub activity"
