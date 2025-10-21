#!/usr/bin/env node

/**
 * Generate a secure encryption key for Flow private key storage
 * Run: node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

console.log('\n=== Flow Encryption Key Generator ===\n');

// Generate a 32-byte (256-bit) random key
const key = crypto.randomBytes(32).toString('hex');

console.log('Your encryption key (add to .env file):\n');
console.log(`FLOW_ENCRYPTION_KEY=${key}\n`);

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Keep this key secret and secure');
console.log('2. Never commit this key to version control');
console.log('3. Store it in a secure key management service (AWS KMS, Vault, etc.)');
console.log('4. Backup this key securely - losing it means losing access to all wallets');
console.log('5. Use different keys for development, staging, and production\n');
