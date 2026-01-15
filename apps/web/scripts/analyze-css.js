#!/usr/bin/env node

/**
 * CSS Analysis Script
 *
 * Analyzes CSS bundle size and identifies potential optimizations.
 * Run with: node scripts/analyze-css.js
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

console.log("🎨 Starting CSS Analysis...\n");

// Step 1: Build the project
console.log("📦 Building project...");
try {
  execSync("pnpm build", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log("✅ Build completed\n");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

// Step 2: Analyze CSS file size
console.log("📊 Analyzing CSS bundle size...");
const cssPath = path.join(__dirname, "..", ".next", "static", "css");

if (!fs.existsSync(cssPath)) {
  console.log(
    "⚠️  CSS directory not found. Make sure build completed successfully."
  );
  process.exit(1);
}

const cssFiles = fs
  .readdirSync(cssPath)
  .filter((file) => file.endsWith(".css"));

if (cssFiles.length === 0) {
  console.log("⚠️  No CSS files found.");
  process.exit(1);
}

let totalSize = 0;
const fileSizes = [];

cssFiles.forEach((file) => {
  const filePath = path.join(cssPath, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  totalSize += stats.size;
  fileSizes.push({ file, size: stats.size, sizeKB });
});

console.log("\n📈 CSS Bundle Analysis:");
console.log("─".repeat(50));
fileSizes
  .sort((a, b) => b.size - a.size)
  .forEach(({ file, sizeKB }) => {
    console.log(`  ${file.padEnd(40)} ${sizeKB.padStart(8)} KB`);
  });
console.log("─".repeat(50));
console.log(`  Total CSS Size: ${(totalSize / 1024).toFixed(2)} KB`);

// Step 3: Check for potential optimizations
console.log("\n🔍 Optimization Recommendations:");

const totalSizeKB = totalSize / 1024;
const targetSize = 50; // Target: 50 KB

if (totalSizeKB > targetSize) {
  console.log(
    `  ⚠️  CSS bundle is ${(totalSizeKB - targetSize).toFixed(2)} KB over target (${targetSize} KB)`
  );
  console.log("  💡 Recommendations:");
  console.log("     - Review Tailwind safelist for unused classes");
  console.log("     - Check for duplicate CSS rules");
  console.log("     - Consider removing unused custom utilities");
  console.log("     - Use CSS-in-JS for component-specific styles");
} else {
  console.log(
    `  ✅ CSS bundle size is within target (${totalSizeKB.toFixed(2)} KB < ${targetSize} KB)`
  );
}

// Step 4: Check Tailwind config
console.log("\n🔧 Tailwind Configuration Check:");
const tailwindConfigPath = path.join(__dirname, "..", "tailwind.config.ts");

if (fs.existsSync(tailwindConfigPath)) {
  const configContent = fs.readFileSync(tailwindConfigPath, "utf-8");

  // Check for safelist
  if (configContent.includes("safelist")) {
    console.log("  ✅ Safelist configured");
  } else {
    console.log(
      "  ⚠️  No safelist found - consider adding one for dynamic classes"
    );
  }

  // Check content paths
  const contentMatches = configContent.match(/content:\s*\[([\s\S]*?)\]/);
  if (contentMatches) {
    const contentPaths = contentMatches[1]
      .split("\n")
      .filter((line) => line.trim() && !line.includes("//")).length;
    console.log(`  ✅ ${contentPaths} content paths configured`);
  }
} else {
  console.log("  ⚠️  Tailwind config not found");
}

console.log("\n✅ CSS analysis complete!");
console.log("\n📚 Next steps:");
console.log("   1. Review largest CSS files");
console.log("   2. Check for unused Tailwind classes");
console.log("   3. Optimize safelist if needed");
console.log("   4. Consider CSS-in-JS for component styles\n");
