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

gh api repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":[]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"require_last_push_approval":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false \
  --field required_linear_history=false \
  --field allow_fork_syncing=false \
  --field lock_branch=false \
  --field allow_lock_branch=false

echo ""
echo "✅ Branch protection rules have been applied!"
echo ""
echo "📝 Protection settings:"
echo "   - Force pushes: DISABLED"
echo "   - Branch deletion: DISABLED"
echo "   - Require pull request reviews: ENABLED (1 approval)"
echo "   - Require status checks: ENABLED (can be configured)"
echo "   - Require admin approval: ENABLED"
echo ""
echo "💡 To add required status checks, edit the protection rules in GitHub:"
echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
