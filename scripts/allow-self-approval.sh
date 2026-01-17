#!/bin/bash

# Script to allow self-approval for branch protection
# This allows repository owners to approve and merge their own PRs

set -e

REPO_OWNER="Oezkandemir"
REPO_NAME="saas"
BRANCH="main"

echo "🔧 Updating branch protection to allow self-approval..."
echo ""

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "Please run: gh auth login"
    exit 1
fi

# Get current user (owner)
CURRENT_USER=$(gh api user --jq .login)
echo "👤 Current user: $CURRENT_USER"
echo ""

# Create temporary JSON file with updated protection settings
# Note: For personal repositories, we can't use bypass_pull_request_allowances
# Instead, we'll disable the review requirement (you can still use PRs, just won't need approval)
TEMP_JSON=$(mktemp)
cat > "$TEMP_JSON" <<EOF
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_linear_history": false,
  "allow_fork_syncing": false,
  "lock_branch": false
}
EOF

# Update branch protection
echo "📋 Updating branch protection rules..."
gh api repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection \
  --method PUT \
  --input "$TEMP_JSON"

# Clean up
rm "$TEMP_JSON"

echo ""
echo "✅ Branch protection updated successfully!"
echo ""
echo "📝 Updated settings:"
echo "   - Force pushes: DISABLED"
echo "   - Branch deletion: DISABLED"
echo "   - Require pull request reviews: DISABLED (you can merge without approval)"
echo "   - Require status checks: DISABLED"
echo "   - Require admin approval: ENABLED"
echo ""
echo "⚠️  Note: Personal repositories don't support bypass_pull_request_allowances."
echo "   Review requirement has been disabled - you can merge PRs directly."
echo ""
echo "🎉 You can now merge your pull requests without approval!"
echo ""
echo "💡 Next steps:"
echo "   1. Go to your PR: https://github.com/$REPO_OWNER/$REPO_NAME/pull/2"
echo "   2. Click 'Merge pull request' (no approval needed)"
echo "   3. Choose merge method and confirm"
