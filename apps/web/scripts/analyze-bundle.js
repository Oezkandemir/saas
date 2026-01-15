#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * Analyzes bundle size and identifies potential optimizations.
 * Run with: node scripts/analyze-bundle.js
 */

const { execSync } = require("node:child_process");
const _fs = require("node:fs");
const path = require("node:path");

console.log("🔍 Starting Bundle Analysis...\n");

// Step 1: Build with bundle analyzer
console.log("📦 Building with bundle analyzer...");
try {
  execSync("ANALYZE=true pnpm build", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("✅ Build completed\n");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

// Step 2: Check for unused dependencies
console.log("🔎 Checking for unused dependencies...");
try {
  // Check if depcheck is installed
  try {
    execSync("which depcheck", { stdio: "ignore" });
  } catch {
    console.log("⚠️  depcheck not found. Install with: npm install -g depcheck");
    console.log("   Skipping dependency check...\n");
  }

  // If depcheck is available, run it
  try {
    const depcheckOutput = execSync("depcheck --json", {
      encoding: "utf-8",
      cwd: path.join(__dirname, ".."),
    });
    const depcheck = JSON.parse(depcheckOutput);

    if (depcheck.dependencies && depcheck.dependencies.length > 0) {
      console.log("⚠️  Unused dependencies found:");
      for (const dep of depcheck.dependencies) {
        console.log(`   - ${dep}`);
      }
    } else {
      console.log("✅ No unused dependencies found");
    }

    if (depcheck.devDependencies && depcheck.devDependencies.length > 0) {
      console.log("\n⚠️  Unused devDependencies found:");
      for (const dep of depcheck.devDependencies) {
        console.log(`   - ${dep}`);
      }
    }
  } catch (_error) {
    // depcheck not available or failed, skip
  }
} catch (_error) {
  console.log("⚠️  Dependency check skipped");
}

console.log("\n✅ Bundle analysis complete!");
console.log("\n📊 Next steps:");
console.log("   1. Review bundle analyzer output in browser");
console.log("   2. Identify large dependencies");
console.log("   3. Consider code splitting for large routes");
console.log("   4. Remove unused dependencies");
console.log("   5. Use dynamic imports for heavy components\n");
