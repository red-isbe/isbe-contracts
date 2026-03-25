# E2E Testing Guide - ISBE Contracts

## Overview

This guide explains how to set up and run end-to-end (E2E) tests for ISBE Contracts, including DID Registry and Trusted Issuers Registry (TIR) integration.

## Prerequisites

### 1. Network Setup with isbe-network-builder

The E2E tests require a running ISBE network with deployed facets and governance diamond.

#### Step 1.1: Clone isbe-network-builder

```bash
# Clone the repository
git clone https://github.com/red-isbe/isbe-network-builder.git
cd isbe-network-builder
```

#### Step 1.2: Fix Submodule URLs (SSH to HTTPS)

**Issue**: Submodules are configured with SSH URLs that may fail without SSH keys.

**Solution**: Convert SSH URLs to HTTPS URLs:

```bash
# View current submodule URLs
cat .gitmodules

# Replace SSH with HTTPS URLs
sed -i 's|git@github.com:|https://github.com/|g' .gitmodules

# Verify the change
cat .gitmodules
```

**Expected output after fix**:

```
[submodule "modules/isbe-contracts"]
    path = modules/isbe-contracts
    url = https://github.com/red-isbe/isbe-contracts.git
[submodule "modules/isbe-besu-local-deployer"]
    path = modules/isbe-besu-local-deployer
    url = https://github.com/red-isbe/isbe-besu-local-deployer.git
```

#### Step 1.3: Initialize Repository

```bash
# Sync submodule configuration
git submodule sync

# Initialize and update submodules recursively
git submodule update --init --recursive
```

#### Step 1.4: Install Dependencies

```bash
# Run init script (npm install, husky setup)
./scripts/init-repo.sh
```

**Expected output**:

```
📁 Repository root: /tmp/e2e/isbe-network-builder
🔄 Syncing submodule configuration (.gitmodules → .git/config)...
📥 Initializing and updating submodules (recursive)...
added 887 packages, and audited 888 packages in 10s
✅ Submodules initialized and updated.
```

#### Step 1.5: Generate Network and Deploy Governance

```bash
# Generate genesis and deploy all governance contracts
./generateAll.sh
```

**This deploys**:

- 20 facets (BusinessLogicFactory, AccessControl, DID, TIR, etc.)
- Governance diamond at `0x00000000000000000000000000000000000015BE`
- Initializes DID Registry with elliptic curve type

**Sample output**:

```
🚀 Starting full network generation process...
🔐 Dumping Hardhat private keys into private/hardhat-keys.txt...
✅ Output directories prepared.
Generating network for CASE....
🔧 Modifying account allocations...
🚀 Deploying governance factory...
  Deploying ISBE factory with secp256k1...
  Deploying BusinessLogicFactoryFacet...
  ✅ BusinessLogicFactoryFacet deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  ... (19 more facets)
✅ All 20 facets deployed successfully
Deploying diamond proxy...
✅ Governance system successfully deployed
```

### 2. Environment Variables

Configure environment for the test network:

```bash
# For CASE network (MSI - from EVO machine)
export ISBE_URL=http://msi:8548
export CHAIN_ID=11073
export CURVE=secp256k1

# For local network (localhost)
export ISBE_URL=http://localhost:8545
export CHAIN_ID=1337
export CURVE=secp256k1
```

### 3. Diamond Address

The Diamond is deployed at the fixed address:

```
0x00000000000000000000000000000000000015BE
```

## Running E2E Tests

### Basic Execution

```bash
# From isbe-contracts repository
cd test-integration/e2e

# Run DID + TIR integration test
ISBE_URL=http://msi:8548 CHAIN_ID=11073 CURVE=secp256k1 \
  npx hardhat run 01-did-tir-integration.ts --network isbe
```

### Using run-integration-tests.sh

```bash
# Execute integration test script
./test-integration/run-integration-tests.sh
```

## Test Architecture

### Test Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    E2E TEST FLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│ PASO 1: Create DID for Issuer                                       │
│   - Generate wallet from mnemonic (timestamp-based path)            │
│   - Fund wallet from deployer                                       │
│   - Generate proof and derive DID                                   │
│   - Call insertFirstDidDocument with publicKey                      │
│                                                                     │
│ PASO 2: Create DID for Controller                                   │
│   - Generate wallet from mnemonic (path + 1)                        │
│   - Fund wallet from deployer                                       │
│   - Generate proof and derive DID                                   │
│   - Call insertFirstDidDocument with publicKey                      │
│                                                                     │
│ PASO 3: Configure TIR Hierarchy                                     │
│   - 3.1: Grant TRUSTED_ISSUERS_REGISTRY_ROLE to deployer             │
│   - 3.2: Register issuer as ROOT_TAO                                │
│   - 3.3: Register issuer as TI (accredited by ROOT_TAO)             │
│                                                                     │
│ PASO 4: Add Controller to DID                                       │
│   - Connect issuerWallet (not hardhat account)                      │
│   - Call addController with controller DID                          │
│                                                                     │
│ PASO 5: Integration Validation                                       │
│   - Verify issuer in TIR                                            │
│   - Verify DID exists                                               │
│   - Verify controllers                                              │
│                                                                     │
│ PASO 6: Persistence Validation                                       │
│   - Re-query all data                                               │
│   - Verify persistence                                              │
│                                                                     │
│ PASO 7: Gas Summary                                                 │
│   - Report total gas used                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

#### DID Derivation

DIDs are cryptographically derived from signatures:

```typescript
import { generateProof, proofToDid } from '../../test/support/identity/did'

// Generate proof from wallet
const proof = generateProof(wallet)

// Derive DID from proof (last 19 bytes of 65-byte signature)
const did = proofToDid(proof)

// DID structure: [13 zero bytes | 19 payload bytes]
```

#### Proof Validation

The contract validates:

1. **Signature validity**: `proof` signs `keccak256(publicKey)`
2. **DID structure**: 13 zero bytes + 19 payload bytes
3. **DID matches proof**: DID payload = last 19 bytes of proof

```solidity
// DidDocumentDetailedInternal.sol
function _validateProof(
    bytes32 _did,
    bytes memory _proof,
    bytes memory _publicKey
) internal pure {
    // Recover signer from signature
    address recoveredSigner = _recoverSigner(
        keccak256(abi.encodePacked(_publicKey)),
        _proof
    );

    // Verify signer matches public key
    require(
        recoveredSigner == _getAddress(_publicKey),
        InvalidSignature(recoveredSigner)
    );

    // Verify DID structure and derivation
    // DID = [13 zeros | 19 last bytes of proof]
}
```

#### TIR Trust Hierarchy

```
ROOT_TAO (Trust Anchor)
   └─► Only created by: TRUSTED_ISSUERS_REGISTRY_ROLE holder
   └─► Self-referential (taoDid = rootTaoDid)

TAO (Trust Anchor Organization)
   └─► Created by: ROOT_TAO holder

TI (Trusted Issuer)
   └─► Created by: TAO or ROOT_TAO holder
```

## Troubleshooting

### Issue 1: Submodule Clone SSH Failure

**Error**:

```
fatal: clonación de 'git@github.com:red-isbe/isbe-besu-local-deployer.git' en la ruta de submódulo
Falló al clonar 'modules/isbe-besu-local-deployer' una segunda vez, abortando
```

**Cause**: SSH URLs require SSH keys that may not be configured.

**Solution**: Convert SSH to HTTPS URLs:

```bash
sed -i 's|git@github.com:|https://github.com/|g' .gitmodules
git submodule sync
git submodule update --init --recursive
```

### Issue 2: DID Already Exists

**Error**: `DidAlreadyExists` when creating DID

**Cause**: Same derivation path produces same DID.

**Solution**: Use timestamp-based paths in test fixtures:

```typescript
const runId = (Date.now() % 10000) + 1000
const issuerPath = `m/44'/60'/0'/0/${runId}`
const controllerPath = `m/44'/60'/0'/0/${runId + 1}`
```

### Issue 3: Wrong publicKey Parameter Size

**Error**: `BytesInLengthType` or similar parameter validation error

**Cause**: `insertFirstDidDocument` expects 65-byte `publicKey`, not 20-byte `address`.

**Solution**:

```typescript
// WRONG - passing address (20 bytes)
const publicKey = await issuerWallet.getAddress()

// CORRECT - passing public key (65 bytes)
const publicKey = issuerWallet.signingKey.publicKey // 65 bytes for secp256k1
```

### Issue 4: Wrong Signer for DID Operations

**Error**: `ControllerNotAuthorized` or similar access control errors

**Cause**: Using Hardhat default signers instead of derived wallet signers.

**Solution**: Use the wallet that controls the DID:

```typescript
// WRONG - using hardhat account
await didControllerFacet.connect(issuer).addController(...)

// CORRECT - using derived wallet
await didControllerFacet.connect(issuerWallet).addController(...)
```

### Issue 5: TIR Hierarchy Not Configured

**Error**: `SenderCannotInteractWithRootTao` or `SenderIsNotTaoOrRootTao`

**Cause**: Attempting to create TI without ROOT_TAO.

**Solution**: Create ROOT_TAO first:

```typescript
// 1. Grant TRUSTED_ISSUERS_REGISTRY_ROLE to deployer
await accessControl.grantRole(TRUSTED_ISSUERS_REGISTRY_ROLE, deployer.address)

// 2. Create ROOT_TAO
await trustedIssuersRegistry.setAttributeMetadata(
    issuerDid,
    IssuerType.ROOT_TAO,
    revisionId,
    ZeroHash, // self-referential
    ZeroHash
)

// 3. Then create TI
await trustedIssuersRegistry.setAttributeMetadata(
    issuerDid,
    IssuerType.TI,
    tiRevisionId,
    issuerDid, // accredited by ROOT_TAO
    rootTaoRevisionId
)
```

### Issue 6: addController Wrong Wallet

**Error**: Transaction reverts when adding controller

**Cause**: Using wrong wallet when calling `addController`.

**Solution**: Ensure the signer matches the DID owner:

```typescript
// Connect with the wallet that owns issuerDid
const didControllerFacet = await ethers.getContractAt(
    'DidControllerFacet',
    DIAMOND_ADDRESS,
    issuerWallet // MUST be issuerWallet, not deployer
)

await didControllerFacet.addController(issuerDid, controllerDid)
```

### Issue 7: Insufficient Funds for Derived Accounts

**Error**: Transaction fails due to insufficient gas

**Cause**: Derived wallets don't have ETH for transactions.

**Solution**: Fund derived wallets from deployer:

```typescript
const deployerSigner = (await ethers.getSigners())[0]

// Fund issuer wallet
await deployerSigner.sendTransaction({
    to: await issuerWallet.getAddress(),
    value: ethers.parseEther('1.0'),
})

// Fund controller wallet
await deployerSigner.sendTransaction({
    to: await controllerWallet.getAddress(),
    value: ethers.parseEther('1.0'),
})
```

## Gas Reference

| Operation             | Gas            |
| --------------------- | -------------- |
| Create DID Issuer     | ~920,000       |
| Create DID Controller | ~920,000       |
| Register ROOT_TAO     | ~291,000       |
| Register TI           | ~237,000       |
| Add Controller        | ~156,000       |
| **Total**             | **~2,400,000** |

## Network Configuration

### hardhat.config.ts

```typescript
networks: {
    isbe: {
        url: process.env.ISBE_URL || 'http://localhost:8545',
        chainId: parseInt(process.env.CHAIN_ID || '11073'),
        accounts: CURVE === 'secp256k1'
            ? accounts
            : secp256r1PrivateKeys,
        gasPrice: 2_000_000_000,
    }
}
```

## Wallet Creation Pattern

When creating wallets in test fixtures:

```typescript
import { HDNodeWallet, ethers } from 'hardhat'
import { config } from 'hardhat'

const accountsConfig = config.networks.hardhat.accounts as { mnemonic: string }

// CORRECT: Empty string for password, path as 3rd argument
const wallet = HDNodeWallet.fromPhrase(
    accountsConfig.mnemonic,
    '', // password (empty)
    "m/44'/60'/0'/0/0" // derivation path
).connect(ethers.provider) // MUST connect to provider!
```

## Checklist Before Running Tests

- [ ] `isbe-network-builder` cloned and initialized
- [ ] Submodules synced (SSH→HTTPS fix applied)
- [ ] `./scripts/init-repo.sh` executed
- [ ] `./generateAll.sh` executed (facets + governance deployed)
- [ ] Diamond is deployed at `0x00000000000000000000000000000000000015BE`
- [ ] DID Registry is initialized with elliptic curve type
- [ ] Facets are registered
- [ ] Environment variables are set correctly (`ISBE_URL`, `CHAIN_ID`, `CURVE`)

## Debugging

### Check Diamond Facets

```bash
npx hardhat run scripts/check-diamond-facets.ts --network isbe
```

### Check Existing DIDs

```bash
npx hardhat run scripts/check-existing-dids.ts --network isbe
```

### Check Role Assignment

```bash
npx hardhat run scripts/check-tir-role.ts --network isbe
```

### Diagnostic Mode in Tests

```typescript
// In test file, add debug output
console.log('DID derived:', did)
console.log('Wallet address:', await wallet.getAddress())
console.log('Public key:', wallet.signingKey.publicKey)
console.log('Diamond address:', DIAMOND_ADDRESS)
```

## References

- [ISBE-23: E2E Testing Diamond Pattern](./E2E-Testing-Diamond-Pattern.md)
- [ISBE Architecture Documentation](./README.md)
- [DID Registry Contract](../contracts/identity/didregistry/)
- [Trusted Issuers Registry Contract](../contracts/identity/trustedissuersregistry/)
- [CLAUDE.md - Project Conventions](../CLAUDE.md)
