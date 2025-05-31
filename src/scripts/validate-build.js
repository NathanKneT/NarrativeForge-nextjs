#!/usr/bin/env node
// scripts/validate-build.js - Version simple

const fs = require('fs');
const path = require('path');

console.log('🔍 Basic build validation...');

const buildDir = path.join(process.cwd(), '.next');
const standaloneDir = path.join(buildDir, 'standalone');

// Check if .next directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory (.next) not found');
  process.exit(1);
}

// Check if standalone build exists (for Docker)
if (fs.existsSync(standaloneDir)) {
  console.log('✅ Standalone build found');
  
  // Check if server.js exists in standalone
  const serverFile = path.join(standaloneDir, 'server.js');
  if (!fs.existsSync(serverFile)) {
    console.error('❌ server.js not found in standalone build');
    process.exit(1);
  }
} else {
  console.log('⚠️ Standalone build not found (normal for development)');
}

// Check if static assets exist
const staticDir = path.join(buildDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.error('❌ Static assets directory not found');
  process.exit(1);
}

// Check if build manifest exists
const buildManifest = path.join(buildDir, 'build-manifest.json');
if (!fs.existsSync(buildManifest)) {
  console.error('❌ Build manifest not found');
  process.exit(1);
}

// Validate build manifest
try {
  const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
  if (!manifest.pages || Object.keys(manifest.pages).length === 0) {
    console.error('❌ No pages found in build manifest');
    process.exit(1);
  }
  console.log(`✅ Found ${Object.keys(manifest.pages).length} pages in build`);
} catch (error) {
  console.error('❌ Invalid build manifest:', error.message);
  process.exit(1);
}

// Check bundle sizes
const getDirectorySize = (dirPath) => {
  let size = 0;
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    }
  }
  return size;
};

const buildSize = getDirectorySize(buildDir);
const buildSizeMB = (buildSize / (1024 * 1024)).toFixed(2);

console.log(`📊 Total build size: ${buildSizeMB} MB`);

// Warn if build is too large (> 50MB for this project)
if (buildSize > 50 * 1024 * 1024) {
  console.warn(`⚠️ Build size is large (${buildSizeMB} MB). Consider optimization.`);
}

console.log('✅ Basic build validation completed successfully!');
process.exit(0);