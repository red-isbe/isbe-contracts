# Environment Generation Guide

This guide explains how to generate and manage `.env` files for both **secp256k1** and **secp256r1** elliptic curves in the ISBE project.

## Overview

The ISBE project supports dual-curve deployment, allowing contracts to run on networks using either:

- **secp256k1** (standard Ethereum curve)
- **secp256r1** (P-256/prime256v1 curve)

The `generate-env` task provides a convenient way to create properly formatted `.env` files with random accounts for development and testing.

## Quick Start

### Generate secp256r1 accounts (default)

```bash
npx hardhat generate-env
```

### Generate secp256k1 accounts

```bash
npx hardhat generate-env --curve secp256k1
```

### Generate custom number of accounts

```bash
npx hardhat generate-env --curve secp256r1 --count 10
```

## Task Parameters

| Parameter  | Description                    | Default     | Options                  |
| ---------- | ------------------------------ | ----------- | ------------------------ |
| `--curve`  | Elliptic curve to use          | `secp256r1` | `secp256k1`, `secp256r1` |
| `--count`  | Number of accounts to generate | `5`         | `1-50`                   |
| `--output` | Output file path               | `.env`      | Any valid file path      |
| `--backup` | Backup existing .env file      | `false`     | Flag option              |

## Usage Examples

### Basic Examples

```bash
# Generate 5 secp256r1 accounts (default)
npx hardhat generate-env

# Generate 3 secp256k1 accounts
npx hardhat generate-env --curve secp256k1 --count 3

# Generate 10 secp256r1 accounts with backup
npx hardhat generate-env --curve secp256r1 --count 10 --backup

# Generate to custom file
npx hardhat generate-env --output .env.development --count 7
```

### Advanced Examples

```bash
# Generate production-style setup with many accounts
npx hardhat generate-env --curve secp256r1 --count 20 --output .env.production --backup

# Generate for different networks
npx hardhat generate-env --curve secp256k1 --count 5 --output .env.mainnet
npx hardhat generate-env --curve secp256r1 --count 5 --output .env.besu

# Generate and validate in one workflow
npx hardhat generate-env --curve secp256r1 --count 8
npx hardhat validate-generated-env
```

## Generated .env File Format

The generated `.env` file contains:

```env
ACCOUNTS=private_key_1,private_key_2,private_key_3,...
ACCOUNT_ADDRESS=0x...  # Address of first account
ACCOUNT_PRIVATE_KEY=0x...  # Private key of first account

; Detailed comments with:
; - Generation timestamp
; - Curve type used
; - Complete account details
; - Public keys (for secp256r1)
; - Security warnings
```

## secp256k1 vs secp256r1 Differences

### secp256k1 (Standard Ethereum)

- **Use case**: Standard Ethereum networks, testnets, L2s
- **Compatibility**: Full Ethereum ecosystem support
- **Tools**: Works with MetaMask, hardware wallets, etc.
- **Generated data**: Private key + address only

### secp256r1 (P-256)

- **Use case**: Hyperledger Besu, enterprise networks
- **Compatibility**: Limited to secp256r1-compatible networks
- **Tools**: Requires custom signing implementations
- **Generated data**: Private key + address + public keys (uncompressed & compressed)

## Validation

### Validate Generated File

```bash
# Validate default .env file
npx hardhat validate-generated-env

# Validate specific file
npx hardhat validate-generated-env --file .env.production
```

### Integration with Existing Tasks

```bash
# Validate using project validation (for configured networks)
npx hardhat validate-accounts --network hardhat
npx hardhat validate-accounts --network customR1Network
```

## Security Considerations

### 🔒 Development vs Production

**Development:**

- Use generated random accounts freely
- No real value at risk
- Convenient for testing and development

**Production:**

- ⚠️ **NEVER use generated accounts on mainnet**
- Use hardware wallets or secure key management
- Consider multi-signature setups
- Implement proper access controls

### Best Practices

1. **File Management**

    ```bash
    # Always backup before generating
    npx hardhat generate-env --backup

    # Use different files for different environments
    .env.development
    .env.testing
    .env.staging
    ```

2. **Git Security**

    ```gitignore
    # Add to .gitignore
    .env*
    *.env
    .env.backup.*
    ```

3. **Access Control**
    ```bash
    # Restrict file permissions
    chmod 600 .env
    ```

## Integration with Deployment

### Workflow Example

```bash
# 1. Generate accounts for your target curve
npx hardhat generate-env --curve secp256r1 --count 10

# 2. Validate the configuration
npx hardhat validate-generated-env

# 3. Fund accounts if needed (on testnet)

# 4. Deploy contracts
npx hardhat deployAll --network customR1Network

# 5. Verify deployment
npx hardhat deployment-summary --network customR1Network
```

### Network Configuration

The generated accounts work automatically with the project's network configurations:

```typescript
// secp256k1 networks
hardhat: {
    curve: 'secp256k1'
}
localhost: {
    curve: 'secp256k1'
}
mvp: {
    curve: 'secp256k1'
}

// secp256r1 networks
customR1Network: {
    curve: 'secp256r1'
}
```

## Troubleshooting

### Common Issues

**Invalid curve parameter:**

```
Error: Invalid curve. Must be secp256k1 or secp256r1
```

_Solution: Use `--curve secp256k1` or `--curve secp256r1`_

**Account limit exceeded:**

```
Error: Count must be between 1 and 50
```

_Solution: Use `--count` value between 1 and 50_

**File permissions:**

```
Error: EACCES: permission denied
```

_Solution: Check file/directory permissions_

### Validation Failures

If validation fails, check:

1. File format is correct
2. Private keys are valid hex strings
3. No corruption during file transfer
4. Proper address derivation

## Migration Guide

### From Manual Account Generation

**Before:**

```javascript
// Manual account generation
const accounts = Array.from(
    { length: 10 },
    () => '0x' + randomBytes(32).toString('hex')
)
```

**After:**

```bash
# Automated generation with validation
npx hardhat generate-env --curve secp256k1 --count 10
```

### From secp256k1 to secp256r1

1. **Generate new accounts:**

    ```bash
    npx hardhat generate-env --curve secp256r1 --backup
    ```

2. **Update network configuration:**

    ```typescript
    customR1Network: {
      curve: 'secp256r1',
      // ... other config
    }
    ```

3. **Deploy and test:**
    ```bash
    npx hardhat deployAll --network customR1Network
    ```

## Available Tasks

| Task                      | Description                             |
| ------------------------- | --------------------------------------- |
| `generate-env`            | Generate random .env file with accounts |
| `validate-generated-env`  | Validate a generated .env file          |
| `validate-accounts`       | Validate accounts for specific network  |
| `show-secp256r1-accounts` | Display secp256r1 account details       |
| `deployment-summary`      | Show complete deployment overview       |

## Advanced Configuration

### Custom Account Formats

For specialized use cases, you can extend the generation logic in:

- `tasks/secp256r1/generateEnv.ts` - Main generation logic
- `utils/secp256r1Utils.ts` - Cryptographic utilities
- `utils/accountValidator.ts` - Validation logic

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Generate test accounts
  run: |
      npx hardhat generate-env --curve secp256r1 --count 5 --output .env.ci
      npx hardhat validate-generated-env --file .env.ci
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the task output for specific error messages
3. Validate your network configuration
4. Ensure proper curve selection for your target network

---

_This guide covers the dual-curve environment generation system that enables seamless development across both secp256k1 and secp256r1 networks._
