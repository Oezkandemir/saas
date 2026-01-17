# Branch Protection Setup Guide

## Overview

This guide explains how to protect the `main` branch in your GitHub repository to prevent force pushes, deletions, and require pull request reviews.

## Quick Setup (Using GitHub CLI)

If you have GitHub CLI installed and authenticated:

```bash
# Make the script executable
chmod +x scripts/setup-branch-protection.sh

# Run the script
./scripts/setup-branch-protection.sh
```

**Note:** You may need to authenticate first:
```bash
gh auth login
```

## Manual Setup via GitHub Web Interface

1. **Navigate to Repository Settings**
   - Go to: https://github.com/Oezkandemir/saas
   - Click on **Settings** (top right)
   - Click on **Branches** (left sidebar)

2. **Add Branch Protection Rule**
   - Click **Add rule** or **Add branch protection rule**
   - In **Branch name pattern**, enter: `main`

3. **Configure Protection Settings**

   ✅ **Recommended Settings:**
   
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners: (optional)
     - ✅ Restrict who can dismiss pull request reviews: (optional)
   
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Add specific status checks (e.g., `build`, `lighthouse`)
   
   - ✅ **Require conversation resolution before merging**
   
   - ✅ **Require signed commits** (optional, but recommended)
   
   - ✅ **Require linear history** (optional)
   
   - ✅ **Require deployments to succeed before merging** (optional)
   
   - ❌ **Do not allow force pushes**
   
   - ❌ **Do not allow deletions**
   
   - ✅ **Restrict who can push to matching branches** (optional)
     - Add specific users/teams who can bypass protection

4. **Save the Rule**
   - Click **Create** or **Save changes**

## Using GitHub API (Alternative)

If you prefer using the GitHub API directly:

```bash
# Set your GitHub token
export GITHUB_TOKEN="your_github_token"

# Create a JSON file with protection settings
cat > branch-protection.json <<EOF
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
  "lock_branch": false
}
EOF

# Apply branch protection
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/Oezkandemir/saas/branches/main/protection \
  -d @branch-protection.json

# Clean up
rm branch-protection.json
```

**Note:** Set `required_status_checks` to `null` if you don't want to require status checks initially. You can enable them later via the GitHub web interface.

## Recommended Status Checks

After setting up branch protection, you can add required status checks:

1. Go to **Settings** → **Branches**
2. Edit the `main` branch protection rule
3. Under **Require status checks to pass before merging**, add:
   - `build` (if you have a build workflow)
   - `lighthouse` (from your Lighthouse CI workflow)
   - Any other CI checks you want to require

## Verification

After setup, verify protection is active:

```bash
# Using GitHub CLI
gh api repos/Oezkandemir/saas/branches/main/protection

# Or check via web interface
# The branch should show a lock icon 🔒 next to it
```

## Troubleshooting

### HTTP 422 Error: "Not all subschemas of 'allOf' matched"
**Problem:** This error occurs when the GitHub API request format is incorrect.

**Solution:** The script has been updated to use proper JSON format. If you encounter this error:
1. Make sure you're using the latest version of the script
2. The script now uses a JSON file instead of `--field` parameters
3. If the error persists, try the manual setup via GitHub web interface

### "Branch protection rules could not be saved"
- Ensure you have admin access to the repository
- Check that you're not trying to protect a branch that doesn't exist

### "Required status checks are not available"
- Make sure your GitHub Actions workflows are running and reporting status
- Status checks appear after at least one successful workflow run
- You can enable status checks later via the GitHub web interface

### "Cannot push to protected branch"
- Create a pull request instead of pushing directly
- Or use a branch that's not protected for testing

## Current Protection Status

To check current protection status:

```bash
gh api repos/Oezkandemir/saas/branches/main/protection
```

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
