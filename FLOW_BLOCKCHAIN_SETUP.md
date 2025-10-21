# Flow Blockchain Integration Setup

This guide explains how to set up and use the Flow blockchain integration for automatic wallet creation during provider signup.

## Overview

When a provider signs up, the system automatically:
1. Creates a new Flow blockchain account on testnet
2. Generates a key pair (public/private keys)
3. Encrypts the private key using AES-256-GCM encryption
4. Stores the wallet address and encrypted private key in the database

## Setup Instructions

### 1. Generate Encryption Key

Generate a secure 64-character hex string (32 bytes) for encrypting private keys:

```bash
openssl rand -hex 32
```

Copy the output and add it to your `.env` file as `FLOW_ENCRYPTION_KEY`.

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Flow Blockchain Configuration (Testnet)
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_SERVICE_ACCOUNT_ADDRESS=your_service_account_address
FLOW_SERVICE_ACCOUNT_PRIVATE_KEY=your_service_account_private_key
FLOW_ENCRYPTION_KEY=your_64_character_hex_encryption_key_here
```

### 3. Flow Service Account (Optional)

For production use, you should have a funded Flow testnet account that can create new accounts.

#### Option A: Use Flow Testnet Faucet (Development)
The system automatically tries to use the Flow testnet faucet API first. This is suitable for development but has rate limits.

#### Option B: Use Your Own Service Account (Recommended for Production)
1. Create a Flow testnet account at https://testnet-faucet.onflow.org/
2. Save the address and private key
3. Add them to your `.env` file

```env
FLOW_SERVICE_ACCOUNT_ADDRESS=0x1234567890abcdef
FLOW_SERVICE_ACCOUNT_PRIVATE_KEY=abc123def456...
```

## Database Schema

The `providers` table now includes:

```sql
wallet_address VARCHAR(255)  -- Flow blockchain address (e.g., 0x1234...)
private_key VARCHAR(255)     -- Encrypted private key (IV:AuthTag:EncryptedData)
```

## API Response

When a provider signs up, the response includes wallet information:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": { ... },
  "provider": {
    "id": "...",
    "email": "...",
    "name": "...",
    "wallet_address": "0x1234567890abcdef",
    // Note: private_key is never included in responses for security
  },
  "wallet": {
    "address": "0x1234567890abcdef"
  }
}
```

## Security Considerations

### Private Key Storage
- Private keys are encrypted using AES-256-GCM before storage
- Encryption key is stored separately in environment variables
- Private keys are NEVER returned in API responses
- Only the wallet address is exposed to the frontend

### Best Practices
1. **Encryption Key Management**: Store `FLOW_ENCRYPTION_KEY` in a secure key management service (AWS KMS, HashiCorp Vault, etc.)
2. **Access Control**: Limit database access to the `private_key` column
3. **Audit Logging**: Monitor access to private keys
4. **Key Rotation**: Implement periodic encryption key rotation
5. **Backup**: Securely backup the encryption key

## Flow Service Methods

### Creating an Account
```typescript
const flowAccount = await this.flowService.createFlowAccount();
// Returns: { address: string, privateKey: string }
```

### Encrypting Private Key
```typescript
const encrypted = this.flowService.encryptPrivateKey(privateKey);
```

### Decrypting Private Key
```typescript
const decrypted = this.flowService.decryptPrivateKey(encryptedData);
```

### Getting Account Info
```typescript
const accountInfo = await this.flowService.getAccountInfo(address);
```

### Checking Balance
```typescript
const balance = await this.flowService.getAccountBalance(address);
```

## Testing

### 1. Test Signup Flow

```bash
curl -X POST http://localhost:3000/provider/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test Provider"
  }'
```

The response should include a `wallet` object with the Flow address.

### 2. Verify on Flow Testnet

Visit https://testnet.flowscan.org/ and search for the wallet address to verify the account exists on the blockchain.

### 3. Check Database

Query the providers table to verify the wallet_address and encrypted private_key are stored:

```sql
SELECT id, email, wallet_address,
       LEFT(private_key, 20) as private_key_preview
FROM providers
WHERE email = 'test@example.com';
```

## Troubleshooting

### Error: "FLOW_ENCRYPTION_KEY must be a 64-character hex string"
- Ensure your encryption key is exactly 64 hexadecimal characters
- Generate using: `openssl rand -hex 32`

### Error: "Flow service account not configured"
- If the testnet faucet is unavailable, you need to configure a service account
- Add `FLOW_SERVICE_ACCOUNT_ADDRESS` and `FLOW_SERVICE_ACCOUNT_PRIVATE_KEY` to `.env`

### Error: "Failed to create blockchain wallet"
- Check network connectivity to Flow testnet
- Verify `FLOW_ACCESS_NODE` URL is correct
- Check Flow testnet status at https://status.onflow.org/

## Resources

- [Flow Documentation](https://developers.flow.com/)
- [Flow FCL (Flow Client Library)](https://github.com/onflow/fcl-js)
- [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
- [Flow Block Explorer](https://testnet.flowscan.org/)
