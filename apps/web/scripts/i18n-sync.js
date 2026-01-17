#!/usr/bin/env node

/**
 * i18n Synchronization Script
 *
 * This script helps synchronize translation keys between language files.
 * It ensures that all keys in target languages exist in the source language,
 * which is required by inlang for proper translation.
 */

const fs = require("node:fs");
const path = require("node:path");

// Configuration
const SOURCE_LANG = "en";
const MESSAGES_DIR = path.join(process.cwd(), "messages");

// Helper to recursively collect all keys from an object
function collectKeys(obj, prefix = "") {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      keys = [...keys, ...collectKeys(value, newKey)];
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

// Helper to set a nested value in an object
function setNestedValue(obj, path, value) {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

// Get all language files
const langFiles = fs
  .readdirSync(MESSAGES_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(".json", ""));

console.log(
  `Found ${langFiles.length} language files: ${langFiles.join(", ")}`
);
console.log(`Source language: ${SOURCE_LANG}`);

// Read the source language file
const sourcePath = path.join(MESSAGES_DIR, `${SOURCE_LANG}.json`);
const sourceData = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sourceKeys = collectKeys(sourceData);

console.log(`Source language has ${sourceKeys.length} translation keys.`);

// Check each target language
for (const lang of langFiles) {
  if (lang === SOURCE_LANG) continue;

  console.log(`\nProcessing ${lang}...`);
  const targetPath = path.join(MESSAGES_DIR, `${lang}.json`);
  const targetData = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  const targetKeys = collectKeys(targetData);

  console.log(`Target language has ${targetKeys.length} translation keys.`);

  // Find keys in target that don't exist in source
  const missingInSource = targetKeys.filter((key) => !sourceKeys.includes(key));
  if (missingInSource.length > 0) {
    console.log(
      `Found ${missingInSource.length} keys in ${lang} that don't exist in ${SOURCE_LANG}`
    );
    console.log("Adding missing keys to source language...");

    // Get values from target and add to source
    for (const key of missingInSource) {
      let value = targetData;
      for (const part of key.split(".")) {
        value = value[part];
        if (value === undefined) break;
      }

      if (value !== undefined) {
        // Add to source language
        setNestedValue(sourceData, key, value);
        console.log(`Added: ${key}`);
      }
    }

    // Write updated source file
    fs.writeFileSync(sourcePath, JSON.stringify(sourceData, null, 2));
    console.log(
      `Updated source language file with ${missingInSource.length} new keys.`
    );
  } else {
    console.log("All keys in target language exist in source language.");
  }
}

console.log("\nSynchronization complete!");
