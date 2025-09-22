# Curve-Aware Hardhat Configuration

This document explains the curve-aware configuration system implemented to support both secp256k1 and secp256r1 elliptic curves in Hardhat tasks.

## Overview

The configuration allows you to define network-specific elliptic curve requirements and adapt task behavior accordingly. While **Hardhat itself cannot natively support secp256r1** for transaction signing, this system provides the foundation for implementing custom solutions.

## Configuration Structure

### Network Configuration (`hardhat.config.ts`)

Networks are configured with an additional `curve` property:

```typescript
const NETWORK_CONFIGS = {
    mvp: {
        url: 'https://besu-node-non-validator-1.mvp.envs.redisbe.com',
        chainId: 2023,
        accounts: ACCOUNTS,
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 0x1e84800,
        curve: 'secp256k1', // Standard Ethereum curve
    },
    customR1Network: {
        url: 'http://your-secp256r1-network:8545',
        chainId: 9999,
        accounts: ACCOUNTS, // Would need secp256r1 keys
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 30000000,
        curve: 'secp256r1', // Custom curve
    },
}
```

### Available Networks

- **secp256k1 networks**: `hardhat`, `localhost`, `mvp`, `arsys`, `kepler`
- **secp256r1 networks**: `customR1Network` (example/placeholder)

## Utilities

### Network Utils (`utils/networkUtils.ts`)

Provides functions to determine network curve requirements:

```typescript
import {
    getNetworkCurve,
    isSecp256r1Network,
    logNetworkInfo,
} from '../utils/networkUtils'

// Check current network's curve
const curve = getNetworkCurve(hre) // 'secp256k1' | 'secp256r1'

// Check if secp256r1 network
if (isSecp256r1Network(hre)) {
    // Handle secp256r1 logic
}

// Log network information
logNetworkInfo(hre)
```

## Task Examples

### Curve-Aware Tasks

Tasks can adapt their behavior based on the network's curve:

```bash
# Check network information
npx hardhat network-info --network mvp
npx hardhat network-info --network customR1Network

# Example curve-aware deployment
npx hardhat curve-aware-deploy --network mvp
npx hardhat curve-aware-deploy --network customR1Network

# Curve-aware version of deployAll
npx hardhat deployAll:curveAware --network mvp
```

### Task Implementation Pattern

```typescript
task('your-task', 'Description').setAction(
    async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        logNetworkInfo(hre)

        if (isSecp256r1Network(hre)) {
            await handleSecp256r1Logic(taskArgs, hre)
        } else {
            await handleSecp256k1Logic(taskArgs, hre)
        }
    }
)
```

## Limitations and Implementation Requirements

### Current Limitations

1. **Hardhat Signer Limitation**: Hardhat's built-in signers only support secp256k1
2. **ethers.js Limitation**: The ethers.js library only supports secp256k1 curve
3. **Transaction Signing**: Custom implementation required for secp256r1 transaction signing

### Requirements for secp256r1 Support

To fully support secp256r1 networks, you would need to implement:

#### 1. Cryptographic Library Integration

```bash
npm install elliptic  # or another secp256r1-compatible library
```

#### 2. Custom Signer Implementation

```typescript
class Secp256r1Signer extends Signer {
    // Custom implementation using secp256r1 curve
    async signTransaction(transaction: TransactionRequest): Promise<string> {
        // Implement secp256r1 transaction signing
    }
}
```

#### 3. Custom Provider

```typescript
class Secp256r1Provider extends JsonRpcProvider {
    // Handle secp256r1-specific RPC calls
}
```

#### 4. Key Management

- Secure storage and loading of secp256r1 private keys
- Key generation utilities for secp256r1
- Address derivation from secp256r1 public keys

## Usage Examples

### Basic Network Information

```bash
# Check mvp network (secp256k1)
$ npx hardhat network-info --network mvp
Network: mvp
Curve: secp256k1
Chain ID: 2023
URL: https://besu-node-non-validator-1.mvp.envs.redisbe.com

# Check custom R1 network (secp256r1)
$ npx hardhat network-info --network customR1Network
Network: customR1Network
Curve: secp256r1
Chain ID: 9999
URL: http://your-secp256r1-network:8545
⚠️  Warning: secp256r1 networks require custom signing implementation
```

### Deployment Examples

```bash
# Deploy to secp256k1 network (standard Ethereum)
npx hardhat deployAll --network mvp

# Deploy to secp256r1 network (requires custom implementation)
npx hardhat deployAll:curveAware --network customR1Network
```

## Extending Existing Tasks

To make existing tasks curve-aware:

1. Import the network utilities
2. Add curve detection logic
3. Implement curve-specific behavior

Example:

```typescript
import { isSecp256r1Network, logNetworkInfo } from '../utils/networkUtils'

task('existing-task', 'Modified to be curve-aware').setAction(
    async (taskArgs, hre) => {
        logNetworkInfo(hre)

        if (isSecp256r1Network(hre)) {
            console.warn('Custom secp256r1 implementation needed')
            // Implement secp256r1-specific logic
        } else {
            // Original secp256k1 logic
        }
    }
)
```

## Future Development

To fully implement secp256r1 support:

1. **Integrate elliptic curve library** with secp256r1 support
2. **Implement custom signers** for secp256r1 transaction signing
3. **Create key management utilities** for secp256r1 keys
4. **Extend deployment orchestration** to use custom signers
5. **Update validation and testing** for secp256r1 networks

## Security Considerations

- **Key Management**: Secure storage and handling of secp256r1 private keys
- **Network Validation**: Ensure target networks actually support secp256r1
- **Transaction Verification**: Implement proper signature verification for secp256r1
- **Testing**: Comprehensive testing on both curve types

## secp256r1 Account Calculation

### Account Generation

The `customR1Network` now automatically generates secp256r1 accounts with proper address calculation:

```bash
# View generated secp256r1 accounts
npx hardhat show-secp256r1-accounts --network customR1Network --count 5

# Generate new secp256r1 accounts
npx hardhat generate-secp256r1-accounts --count 3

# Test cryptographic operations
npx hardhat test-secp256r1-crypto
```

### Address Derivation Process

1. **Generate secp256r1 key pair** using P-256 curve
2. **Extract public key** in uncompressed format (64 bytes x,y coordinates)
3. **Apply Keccak-256 hash** to public key coordinates
4. **Take last 20 bytes** to create Ethereum-compatible address

### Implementation Details

- **Curve**: secp256r1 (P-256/prime256v1)
- **Address Format**: Ethereum-compatible (0x + 40 hex chars)
- **Hashing**: Keccak-256 (same as Ethereum)
- **Key Format**: 32-byte private keys, compressed/uncompressed public keys

### Generated Accounts Example

```
Account 1:
  Address:            0xf108c8dfce576c8e043428a9054f6c5910f924d8
  Private Key:        0x19cf119c104d0a32d77a5d39a26a2cc14300694063d1ee5cb4a63ae8e4859e87
  Public Key:         0479bef12c5b3584b6a3d47a8d4687a7fbc58c90be54ec4a9a8827a471362fc3cd...
  Compressed PubKey:  0379bef12c5b3584b6a3d47a8d4687a7fbc58c90be54ec4a9a8827a471362fc3cd
```

## Files Created/Modified

- `hardhat.config.ts`: Network configuration with secp256r1 account generation
- `utils/networkUtils.ts`: Curve detection utilities
- `utils/secp256r1Utils.ts`: secp256r1 cryptographic operations
- `tasks/examples/curveAwareTask.ts`: Example curve-aware task with account display
- `tasks/examples/curveAwareDeployAll.ts`: Curve-aware deployAll example
- `tasks/secp256r1/showAccounts.ts`: secp256r1 account management tasks
- `docs/CURVE_AWARE_CONFIGURATION.md`: This documentation

## Dependencies Added

- `elliptic`: Elliptic curve cryptography library
- `keccak`: Keccak-256 hashing for address derivation
- `@noble/secp256k1`: Additional curve support

---

**Status**:

- ✅ **secp256r1 account generation**: Complete
- ✅ **Address calculation**: Complete with proper Keccak-256
- ✅ **Key management**: Complete with secure utilities
- ✅ **Curve detection**: Complete for task adaptation
- ⚠️ **Transaction signing**: Requires custom implementation
- ⚠️ **Network deployment**: Requires custom provider
