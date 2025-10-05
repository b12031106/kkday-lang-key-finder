#!/usr/bin/env node

/**
 * Sync version from package.json to manifest.json
 * This script is automatically run by npm version command
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Read manifest.json
const manifestPath = path.join(__dirname, '../manifest.json');
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update version
const oldVersion = manifestJson.version;
const newVersion = packageJson.version;

manifestJson.version = newVersion;

// Write back to manifest.json with same formatting
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n');

console.log(`✅ Version synced: ${oldVersion} → ${newVersion}`);
console.log(`   - package.json: ${newVersion}`);
console.log(`   - manifest.json: ${newVersion}`);
