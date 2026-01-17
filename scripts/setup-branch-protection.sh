#!/bin/bash

# Script to set up branch protection for main branch
# Requires: GitHub CLI (gh) to be installed and authenticated
# Run: gh auth login (if not already authenticated)

set -e

REPO_OWNER="Oezkandemir"
REPO_NAME="saas"
BRANCH="main"

echo "🔒 Setting up branch protection for $BRANCH branch..."
echo ""

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "Please run: gh auth login"
    exit 1
fi

# Set up branch protection rules
echo "📋 Configuring branch protection rules..."

# Create temporary JSON file with protection settings
TEMP_JSON=$(mktemp)
cat > "$TEMP_JSON" <<EOF
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_linear_history": false,
  "allow_fork_syncing": false,
  "lock_branch": false
}
EOF

# Apply branch protection using JSON file
gh api repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection \
  --method PUT \
  --input "$TEMP_JSON"

# Clean up
rm "$TEMP_JSON"

echo ""
echo "✅ Branch protection rules have been applied!"
echo ""
echo "📝 Protection settings:"
echo "   - Force pushes: DISABLED"
echo "   - Branch deletion: DISABLED"
echo "   - Require pull request reviews: ENABLED (1 approval)"
echo "   - Require status checks: DISABLED (can be enabled later)"
echo "   - Require admin approval: ENABLED"
echo ""
echo "💡 To add required status checks, edit the protection rules in GitHub:"
echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
