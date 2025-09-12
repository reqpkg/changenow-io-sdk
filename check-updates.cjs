#!/usr/bin/env node

/**
 * ChangeNow SDK Update Checker
 * 
 * This script helps detect when the ChangeNow SDK might need updates
 * by analyzing the current schema and providing update recommendations.
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, 'src', 'schema.yaml');
const PACKAGE_PATH = path.join(__dirname, 'package.json');

function getSchemaHash() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    throw new Error('Schema file not found: ' + SCHEMA_PATH);
  }
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  return crypto.createHash('sha256').update(schema).digest('hex');
}

function getSchemaInfo() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const stats = fs.statSync(SCHEMA_PATH);
  
  // Extract basic info
  const versionMatch = schema.match(/version:\s*([^\n]+)/);
  const titleMatch = schema.match(/title:\s*([^\n]+)/);
  
  // Count endpoints
  const endpoints = schema.match(/^  \/v[12]\/[^:]+:/gm) || [];
  const v1Endpoints = endpoints.filter(e => e.includes('/v1/')).length;
  const v2Endpoints = endpoints.filter(e => e.includes('/v2/')).length;
  
  return {
    version: versionMatch ? versionMatch[1].trim() : 'unknown',
    title: titleMatch ? titleMatch[1].trim() : 'unknown',
    totalEndpoints: endpoints.length,
    v1Endpoints,
    v2Endpoints,
    lastModified: stats.mtime,
    hash: getSchemaHash()
  };
}

function getPackageInfo() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description
  };
}

function checkForUpdates() {
  console.log('ChangeNow SDK Update Checker');
  console.log('============================\n');
  
  const packageInfo = getPackageInfo();
  const schemaInfo = getSchemaInfo();
  
  console.log('📦 Package Information:');
  console.log(`   Name: ${packageInfo.name}`);
  console.log(`   Version: ${packageInfo.version}`);
  console.log(`   Description: ${packageInfo.description}\n`);
  
  console.log('📋 Schema Information:');
  console.log(`   API Version: ${schemaInfo.version}`);
  console.log(`   API Title: ${schemaInfo.title}`);
  console.log(`   Total Endpoints: ${schemaInfo.totalEndpoints}`);
  console.log(`   V1 Endpoints: ${schemaInfo.v1Endpoints}`);
  console.log(`   V2 Endpoints: ${schemaInfo.v2Endpoints}`);
  console.log(`   Last Modified: ${schemaInfo.lastModified.toISOString()}`);
  console.log(`   Schema Hash: ${schemaInfo.hash.substring(0, 16)}...\n`);
  
  // Check if schema is recent
  const daysSinceUpdate = (Date.now() - schemaInfo.lastModified.getTime()) / (1000 * 60 * 60 * 24);
  
  console.log('🔍 Update Status:');
  if (daysSinceUpdate < 30) {
    console.log('   ✅ Schema appears to be recent (updated within 30 days)');
  } else if (daysSinceUpdate < 90) {
    console.log('   ⚠️  Schema is moderately old (30-90 days)');
    console.log('   📝 Consider checking for API updates');
  } else {
    console.log('   🚨 Schema is old (90+ days)');
    console.log('   📝 Strongly recommend checking for API updates');
  }
  
  console.log(`   📅 Days since last update: ${Math.floor(daysSinceUpdate)}\n`);
  
  console.log('🔗 Update Resources:');
  console.log('   📖 Official Docs: https://documenter.getpostman.com/view/8180765/SVfTPnM8');
  console.log('   📧 API Support: partners@changenow.io');
  console.log('   📋 Update Guide: ./UPDATE_GUIDE.md\n');
  
  console.log('⚡ Quick Commands:');
  console.log('   npm run generate-client  # Regenerate client from current schema');
  console.log('   npm run build           # Build the SDK');
  console.log('   npm test                # Run tests (if available)');
  
  // Store current hash for future comparison
  const hashFile = path.join(__dirname, '.schema-hash');
  const previousHash = fs.existsSync(hashFile) ? fs.readFileSync(hashFile, 'utf8').trim() : null;
  
  if (previousHash && previousHash !== schemaInfo.hash) {
    console.log('\n🔄 Schema has changed since last check!');
    console.log('   Consider reviewing the changes and updating the package version.');
  }
  
  fs.writeFileSync(hashFile, schemaInfo.hash);
  
  return {
    needsUpdate: daysSinceUpdate > 90,
    packageInfo,
    schemaInfo
  };
}

// Run check if called directly
if (require.main === module) {
  try {
    checkForUpdates();
  } catch (error) {
    console.error('❌ Error running update check:', error.message);
    process.exit(1);
  }
}

module.exports = { checkForUpdates, getSchemaInfo, getPackageInfo };