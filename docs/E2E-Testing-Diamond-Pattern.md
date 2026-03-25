# E2E Testing: Diamond Pattern Architecture

> **Critical Knowledge for E2E Integration Tests**

This document captures essential discoveries about the ISBE Diamond Pattern architecture that are critical for writing and running E2E integration tests.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The Diamond Pattern Problem](#the-diamond-pattern-problem)
3. [Genesis Deployment Structure](#genesis-deployment-structure)
4. [Facet Registration Process](#facet-registration-process)
5. [Contract Method Signatures](#contract-method-signatures)
6. [Network Setup for E2E Tests](#network-setup-for-e2e-tests)
7. [Common Pitfalls](#common-pitfalls)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Architecture Overview

### ISBE Contract Architecture

ISBE uses the **Diamond Pattern (EIP-2535)** for upgradeable, modular smart contracts:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Diamond Proxy (EIP2535AccessControl)            │
│                    Address: 0x0000000000000000000000000000000000015BE│
│                    Routes calls to registered facets                │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    │ diamondCut (selector routing)
                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Facets (Business Logic)                        │
├───────────────────┬───────────────────┬──────────────────────────────┤
│ DiamondLoupeFacet │ DidDocumentFacet  │ TrustedIssuersRegistryFacet  │
│ - facets()        │ - getDidDocument()│ - setAttributeMetadata()     │
│ - facetAddress()  │ - createDid()     │ - getIssuer()                │
│ - facetAddresses()│ - addController() │ - isTrustedIssuer()           │
│ - facetFunction... │ - checkController│ - addTrustedIssuer()          │
└───────────────────┴───────────────────┴──────────────────────────────┘
```

### Key Components

| Component              | Description                            | Location           |
| ---------------------- | -------------------------------------- | ------------------ |
| **Diamond Proxy**      | Router contract (EIP2535AccessControl) | `proxies/eip2535/` |
| **Facets**             | Business logic modules                 | `contracts/`       |
| **Internal Libraries** | Storage and shared logic               | `*Internal.sol`    |
| **Storage Positions**  | Deterministic storage slots            | `constants/`       |

### Default Diamond Address

```solidity
// Canonical ISBE Diamond address across all networks
DEFAULT_DIAMOND_ADDRESS = 0x00000000000000000000000000000000000015BE
```

---

## The Diamond Pattern Problem

### The "Missing Facet" Issue

#### Symptom

```
Error: Execution reverted
    at Diamond.facets()
```

#### Root Cause

The **`facets()` function is NOT in the Diamond proxy contract**. It lives in `DiamondLoupeFacet`.

When you call `facets()` on the Diamond:

```
User → Diamond.facets()
         │
         ├── Lookup: "Which facet handles selector 0xcf8ee2d9 (facets)?"
         │
         ├── If facet registered → delegatecall(facet.facets())
         │
         └── If NOT registered → REVERT (no handler found)
```

#### Why This Happens with Genesis Files

Genesis files deploy:

- ✅ **EIP2535AccessControl bytecode** at 0x15BE
- ✅ **Storage for role assignments**
- ❌ **NO facet registrations** (selectors → facet addresses)

The Diamond has bytecode but can't route calls because:

1. No `DiamondLoupeFacet` deployed
2. No selectors mapped to facet addresses
3. Any call to `facets()`, `getDidDocument()`, etc. will revert

#### Critical Insight

```javascript
// WRONG: facets() is NOT a Diamond function
const facets = await diamond.facets() // ❌ REVERTS

// CORRECT: facets() is a DIAMONDLOUPE FACET function
// Must register DiamondLoupeFacet first, then:
const facets = await diamond.facets() // ✅ Works
```

---

## Genesis Deployment Structure

### What's in the Genesis File?

```json
{
  "version": "genesis-local-template",
  "alloc": {
    "0x00000000000000000000000000000000000015BE": {
      "contractName": "EIP2535AccessControl",
      "balance": "0",
      "code": "0x608060405...", // Diamond proxy bytecode (~712 bytes)
      "storage": {
        // Role assignments
        "0x22a8e769...": "0x...0002",  // Role count
        "0x72ac92a6...": "0x...F39F...", // Admin address

        // Facet address mappings (if registered)
        "0x6948d5d0a05b...": "0xe02d3eaf...", // Selector → Facet
        ...
      }
    },
    // Pre-funded accounts
    "0xF39Fd6e51aad...": { "balance": "0xb7abc...", "description": "ISBEADMIN" },
    ...
  }
}
```

### Storage Slots Explained

The Diamond uses deterministic storage positions:

```solidity
// Diamond Storage Position
bytes32 constant _DIAMOND_STORAGE_POSITION = keccak256('isbe.diamond.storage');

struct DiamondStorage {
    // Mapping: function selector → (facet address, position)
    mapping(bytes4 => FacetAddressAndItemPosition) facetAddressAndSelectorPosition;
    // Array of all registered selectors
    bytes4[] selectors;
    // Mapping: interface ID → (facet address, position)
    mapping(bytes4 => FacetAddressAndItemPosition) facetAddressAndInterfacePosition;
    // Array of all supported interfaces
    bytes4[] interfaces;
}
```

### What's Missing from Genesis

The genesis includes:

- ✅ Diamond proxy bytecode
- ✅ Role-based access control (RBAC) initialization
- ✅ Admin account assignments

But does NOT include:

- ❌ Facet contract deployments
- ❌ Selector-to-facet mappings
- ❌ DiamondLoupeFacet registration

---

## Facet Registration Process

### Solution: Update Diamond Facets

Run `updateDiamondFacets` to register all ISBE facets:

```bash
# Full facet deployment and registration
npx hardhat updateDiamondFacets --network localhost

# Preview without executing
npx hardhat updateDiamondFacets --network localhost --dry-run
```

### What This Does

#### Phase 1: Deploy All Facets

```
PHASE 1: FACET DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deploys 21 facets:
1.  BusinessLogicFactoryFacet
2.  ProxyFactoryFacet
3.  GlobalIsbePauseFacet
4.  AccessControlGovernanceFacet
5.  AccessControlDidGovernanceFacet
6.  ISBEPauseFacet
7.  DiamondCutAccessControlFacet
8.  DiamondLoupeFacet          ← Contains facets(), facetAddress()
9.  ConfigurationManagementFacet
10. DidDocumentDetailedFacet    ← Contains getDidDocument()
11. DidControllerFacet          ← Contains addController()
12. DidVerificationMethodFacet
13. DidVerificationRelationshipFacet
14. DidRegistryQueryFacet
15. TrustedIssuersRegistryFacet ← Contains setAttributeMetadata()
16. EnsRegistryFacet
17. TimeStampingRegistryFacet
18. ClientFilteringFacet
19. NetworkDirectoryFacet
20. BesuNodeManagerFacet
21. AnchoringCoreFacet
```

#### Phase 2: Diamond Cut (Register Facets)

```javascript
// Calls diamond.diamondCut() with all facet registrations
await diamond.diamondCut(
    [
        {
            facetAddress: '0xDiamondLoupe...',
            action: Add,
            items: [
                // Function selectors
                '0xcf8ee2d9', // facets()
                '0x...', // facetFunctionSelectors()
                '0x...', // facetAddresses()
                '0x...', // facetAddress(bytes4)
                '0x...', // supportsInterface(bytes4)
            ],
        },
        {
            facetAddress: '0xDidDocument...',
            action: Add,
            items: [
                '0x...', // getDidDocument(bytes32)
                '0x...', // createDid(...)
                // ... more selectors
            ],
        },
        // ... all other facets
    ],
    initAddress,
    initCalldata
)
```

### Verification

```bash
# Verify facets are registered
npx hardhat showDiamondFacets --network localhost

# Expected output:
# Diamond: 0x00000000000000000000000000000000000015BE
#
# Facets:
# ┌──────────────────────────────────────┬───────────────────┐
# │ Facet                                │ Selectors         │
# ├──────────────────────────────────────┼───────────────────┤
# │ DiamondLoupeFacet                    │ 6 selectors       │
# │ DidDocumentDetailedFacet             │ 15 selectors      │
# │ TrustedIssuersRegistryFacet          │ 12 selectors      │
# │ ...                                  │ ...               │
# └──────────────────────────────────────┴───────────────────┘
```

---

## Contract Method Signatures

### DID Registry

```solidity
// DID Document structure
struct DidDocument {
    bytes32 did;                           // W3C DID identifier
    address[] controllers;                  // DID controllers (addresses)
    mapping(bytes32 => VerificationMethod) verificationMethods;
    // ...
}

// ❌ WRONG METHOD SIGNATURES (don't exist)
didExists(did)                      // Use getDidDocument(did) instead
addTrustedIssuer(address, topics)  // Not in DID Registry
setAttributeMetadata(did, attr, val) // Wrong params (3 vs 5)

// ✅ CORRECT METHOD SIGNATURES
function getDidDocument(bytes32 did) returns (DidDocument memory)
function createDid(bytes proof, bytes32 controllerDid, bytes32 taoDid, bytes32 revisionId)
function addController(bytes32 did, bytes32 controllerDid)  // DID-to-DID
function checkController(bytes32 did, address controller) returns (bool)
```

### Trusted Issuers Registry

```solidity
// Issuer structure
struct Issuer {
    bool isTrusted;
    uint256 issuerType;
}

// ❌ WRONG METHOD SIGNATURES
addTrustedIssuer(address, claimTopics)  // Doesn't exist

// ✅ CORRECT METHOD SIGNATURES
function getIssuer(bytes32 did) returns (bool isTrusted, uint256 issuerType)
function setAttributeMetadata(
    bytes32 did,
    uint256 issuerType,
    bytes32 revisionId,
    bytes32 taoDid,
    bytes32 attributeIdTao
) external
```

### DID Derivation

DIDs are cryptographically derived from proof signatures:

```typescript
// DID Structure: [13 zero bytes | 19 payload bytes]
// Payload: last 19 bytes of keccak256(proof)

const proof = await signer.signMessage(didPayload)
const did = deriveDidFromProof(proof)

// Example:
// proof: 0x3045022100... (65 bytes)
// did: 0x00000000000000000000000000000000000000[did:19bytes]
```

### Controller Management

Controllers use **DID-based relationships**, not address-based:

```solidity
// DID Controller Management
function addController(bytes32 did, bytes32 controllerDid)
function removeController(bytes32 did, bytes32 controllerDid)

// Controller Authorization
// Step 1: Derive DID from proof
bytes32 did = proofToDid(proof);

// Step 2: Check controller authorization
bool isAuthz = checkController(did, controllerAddress);
```

---

## Network Setup for E2E Tests

### Prerequisites

1. **isbe-network-builder** - Create genesis files
2. **isbe-besu-local-deployer** - Start local Besu network
3. **isbe-contracts** - Run tests

### Step-by-Step Setup

#### 1. Create Local Network

```bash
cd /path/to/isbe-network-builder

# Generate CASE network (secp256k1)
./generateAll.sh

# Output: output/isbe-network-case/
#   - genesis.json (with Diamond at 0x15BE)
#   - config/ (Besu config)
#   - keys/ (validator keys)
```

#### 2. Start Besu Network

```bash
cd /path/to/isbe-network-builder/output/isbe-network-case

# Start network
bash startNetwork.sh
# or
./besu-1.sh & ./besu-2.sh & ./besu-3.sh & ./besu-4.sh &

# Verify RPC
curl -X POST http://172.16.240.30:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### 3. Register Diamond Facets

**FOR GENESIS-BASED NETWORKS** (networks created from genesis files):

```bash
cd /path/to/isbe-contracts

# Configure network
cat > .env <<EOF
LOCALHOST_URL=http://172.16.240.30:8545
ACCOUNT_ADDRESS=0xYourAddress
ACCOUNT_PRIVATE_KEY=0xYourPrivateKey
EOF

# Bootstrap facets (DEPLOY AND REGISTER IN ONE STEP)
# This solves the chicken-and-egg problem where genesis lacks facet registrations
npx hardhat genesis:bootstrap --governanceaddress 0x00000000000000000000000000000000000015BE --network localhost

# Alternative: Only deploy facets without usecases
npx hardhat genesis:bootstrap --governanceaddress 0x00000000000000000000000000000000000015BE --network localhost --onlyfacets
```

**FOR FULLY DEPLOYED NETWORKS** (networks with all contracts pre-deployed):

```bash
# If facets are already deployed but not registered
npx hardhat updateDiamondFacets --network localhost
```

**⚠️ CRITICAL DISTINCTION:**

- `genesis:bootstrap` - Deploys AND registers facets in one operation (for genesis networks)
- `updateDiamondFacets` - Only registers already-deployed facets (requires facets to be registered first)

The genesis generation process creates the Diamond proxy contract but does NOT include facet selector mappings. This means calling `facets()` or any Diamond function will REVERT until facets are registered. Use `genesis:bootstrap` to solve this.

#### 4. Run E2E Tests

```bash
# Set environment
export LOCALHOST_URL=http://172.16.240.30:8545
export DIAMOND_ADDRESS=0x00000000000000000000000000000000000015BE

# Run integration test
npx hardhat run test-integration/e2e/01-did-tir-integration.ts --network localhost
```

### E2E Test Template

```typescript
// test-integration/e2e/01-did-tir-integration.ts

import { ethers } from 'hardhat'
import { expect } from 'chai'

const DIAMOND_ADDRESS = '0x00000000000000000000000000000000000015BE'

describe('E2E: DID Registry + Trusted Issuers Registry Integration', function () {
    let diamond: any
    let didRegistry: any
    let tirRegistry: any
    let admin: any

    before(async function () {
        // Get signers
        ;[admin] = await ethers.getSigners()

        // Connect to deployed Diamond
        diamond = await ethers.getContractAt(
            'EIP2535AccessControl',
            DIAMOND_ADDRESS
        )

        // Get facet interfaces through Diamond
        didRegistry = await ethers.getContractAt(
            'DidDocumentDetailedFacet',
            DIAMOND_ADDRESS
        )
        tirRegistry = await ethers.getContractAt(
            'TrustedIssuersRegistryFacet',
            DIAMOND_ADDRESS
        )

        // Verify facets are registered
        const facets = await diamond.facets()
        expect(facets.length).to.be.greaterThan(0)
    })

    describe('Step 1: DID Creation', function () {
        it('should create DID with proof signature', async function () {
            // Generate proof and derive DID
            const didPayload = ethers.solidityPacked(['string'], ['test-did'])
            const proof = await admin.signMessage(didPayload)
            const did = proofToDid(proof)

            // Create DID document
            const tx = await didRegistry.createDid(
                proof,
                did, // controllerDid
                ethers.ZeroHash, // taoDid
                ethers.ZeroHash // revisionId
            )

            await tx.wait()

            // Verify DID exists
            const doc = await didRegistry.getDidDocument(did)
            expect(doc.did).to.equal(did)
        })
    })

    describe('Step 2: Trusted Issuer Registration', function () {
        it('should register trusted issuer', async function () {
            const issuerDid = '0x...' // Derived from proof

            const tx = await tirRegistry.setAttributeMetadata(
                issuerDid,
                1, // issuerType
                ethers.ZeroHash, // revisionId
                ethers.ZeroHash, // taoDid
                ethers.ZeroHash // attributeIdTao
            )

            await tx.wait()

            // Verify issuer is trusted
            const [isTrusted, issuerType] =
                await tirRegistry.getIssuer(issuerDid)
            expect(isTrusted).to.be.true
            expect(issuerType).to.equal(1)
        })
    })

    // ... more test cases
})

// Helper: Derive DID from proof signature
function proofToDid(proof: string): string {
    const proofHash = ethers.keccak256(proof)
    const payload = proofHash.slice(-42) // Last 19 bytes (0x + 38 chars)
    const zeros = '0x00000000000000000000000000000000000000'
    return zeros + payload.slice(2) // 13 zeros + 19 payload
}
```

---

## Common Pitfalls

### 1. Calling Methods Before Facet Registration

```typescript
// ❌ WRONG: Diamond deployed but facets not registered
const diamond = await ethers.getContractAt(
    'EIP2535AccessControl',
    DIAMOND_ADDRESS
)
const facets = await diamond.facets() // REVERTS!

// ✅ CORRECT: Register facets first
await run('updateDiamondFacets', { network: 'localhost' })
const facets = await diamond.facets() // Works!
```

### 2. Wrong Method Signatures

```typescript
// ❌ WRONG: 3 parameters
await tirRegistry.setAttributeMetadata(did, attr, value)

// ✅ CORRECT: 5 parameters
await tirRegistry.setAttributeMetadata(
    did,
    issuerType,
    revisionId,
    taoDid,
    attributeIdTao
)
```

### 3. Address-Based Controller (Should be DID-Based)

```typescript
// ❌ WRONG: Passing controller address
await didRegistry.addController(did, controllerAddress)

// ✅ CORRECT: Passing controller DID
await didRegistry.addController(did, controllerDid)
```

### 4. Wrong DID Check Method

```typescript
// ❌ WRONG: didExists() doesn't exist
const exists = await didRegistry.didExists(did)

// ✅ CORRECT: Use getDidDocument()
const doc = await didRegistry.getDidDocument(did)
const exists = doc.did !== ethers.ZeroHash
```

### 5. Forgetting Network URL

```typescript
// ❌ WRONG: Defaults to localhost:8545
npx hardhat run test.ts --network localhost

// ✅ CORRECT: Explicit URL
export LOCALHOST_URL=http://172.16.240.30:8545
npx hardhat run test.ts --network localhost
```

---

## Troubleshooting Guide

### "Execution reverted" When Calling `facets()`

**Diagnosis:**

```bash
# Check if Diamond has bytecode
npx hardhat contract-info --address 0x...15BE --network localhost

# Expected:
# ✅ Contract: EIP2535AccessControl
# ✅ Bytecode: 712 bytes

# Check if facets are registered
npx hardhat showDiamondFacets --network localhost

# Expected:
# ✅ List of facets with selectors

# If empty or error:
# ❌ No facets registered
```

**Solution:**

```bash
# Register all ISBE facets
npx hardhat updateDiamondFacets --network localhost

# Verify
npx hardhat showDiamondFacets --network localhost
```

### "Invalid calldata format" Error

**Diagnosis:**

Wrong method signature or parameter count.

**Solution:**

Verify correct method signature:

```typescript
// Check interface
const iface = new ethers.Interface([
    'function setAttributeMetadata(bytes32,uint256,bytes32,bytes32,bytes32) external',
    'function addController(bytes32,bytes32) external',
    'function checkController(bytes32,address) returns (bool)',
])

// Get calldata
const calldata = iface.encodeFunctionData('setAttributeMetadata', [
    did,
    issuerType,
    revisionId,
    taoDid,
    attrId,
])
```

### "DidNotDerivedFromProof" Error

**Diagnosis:**

DID not cryptographically derived from proof signature.

**Solution:**

```typescript
// Derive DID correctly from proof
function deriveDidFromProof(proof: string): string {
    const proofHash = ethers.keccak256(proof)
    // DID = [13 zero bytes | last 19 bytes of keccak256(proof)]
    const payload = proofHash.slice(-42) // Last 19 bytes (with 0x prefix)
    const zeros = '0x00000000000000000000000000000000000000'
    return zeros + payload.slice(2) // 13 zeros + 19 payload bytes
}

// Generate proof and create DID
const didPayload = ethers.solidityPacked(['string'], ['test-did'])
const proof = await signer.signMessage(didPayload)
const did = deriveDidFromProof(proof)
```

### Network Connection Issues

**Diagnosis:**

```bash
# Check if Besu is running
docker ps --filter label=project=besu

# Check RPC endpoint
curl -X POST http://172.16.240.30:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Solution:**

```bash
# Restart network
cd /path/to/isbe-network-builder/output/isbe-network-case
bash stopNetwork.sh
bash startNetwork.sh
```

### Diamond Code Verification

```typescript
// Verify Diamond has bytecode
const code = await ethers.provider.getCode(DIAMOND_ADDRESS)
console.log('Diamond bytecode length:', code.length)

// Expected: ~1426 characters (712 bytes bytecode)
// If '0x' (empty): Diamond not deployed
// If shorter: Wrong contract or partial deployment
```

---

## See Also

- [Integration Testing Guide](Integration-Testing.md)
- [Diamond Pattern Guidelines](Diamond-pattern-guidelines.md)
- [Genesis Generator Documentation](Genesis-generator.md)
- [Network Bootstrapping](Network-Bootstrapping.md)

---

## Quick Start: Network Setup & Facet Registration

> **IMPORTANT**: Follow these steps in order BEFORE running any E2E tests. Tests will fail without facet registration.

### Step 1: Generate Network (One-time Setup)

```bash
cd /path/to/isbe-network-builder

# Generate CASE network (secp256k1)
./generateAll.sh

# Output creates:
# - output/isbe-network-case/genesis.json
# - output/isbe-network-case/config/
# - output/isbe-network-case/keys/
```

### Step 2: Configure Local Network in hardhat.config.ts

```typescript
// hardhat.config.ts - Add this network configuration
networks: {
  localhost: {
    url: process.env.LOCALHOST_URL || 'http://172.16.240.30:8545',
    chainId: 2222,
    accounts: process.env.ACCOUNT_PRIVATE_KEY ? [process.env.ACCOUNT_PRIVATE_KEY] : [],
    gasPrice: 0,
    gas: 100000000,
  },
}
```

### Step 3: Start Local Besu Network

```bash
cd /path/to/isbe-network-builder/output/isbe-network-case

# Start all 4 Besu validator nodes
bash startNetwork.sh

# Or start manually:
./besu-1.sh &
./besu-2.sh &
./besu-3.sh &
./besu-4.sh &

# Wait for network to be ready (30-60 seconds)
sleep 60

# Verify network is running
curl -X POST http://172.16.240.30:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Expected: {"jsonrpc":"2.0","id":1,"result":"0x0"}
```

### Step 4: Verify Diamond Deployment (CRITICAL)

```bash
cd /path/to/isbe-contracts

# Check Diamond has bytecode
npx hardhat contract-info --address 0x00000000000000000000000000000000000015BE --network localhost

# Expected output:
# ✅ Diamond deployed at 0x...15BE
# ✅ Bytecode: 712 bytes (EIP2535AccessControl)
# ✅ Network: localhost (Chain ID: 2222)
```

### Step 5: Register Facets (REQUIRED BEFORE TESTS)

> **CRITICAL**: Without this step, any call to `facets()`, `getDidDocument()`, `setAttributeMetadata()` will REVERT.

```bash
# Register all ISBE facets in the Diamond
npx hardhat updateDiamondFacets --network localhost

# Expected output:
# ═══════════════════════════════════════════════════════════════
#            ISBE Diamond Facet Update Tool
# ═══════════════════════════════════════════════════════════════
# 🔍 Network: localhost
# 📍 Diamond: 0x00000000000000000000000000000000000015BE
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 1: FACET DEPLOYMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ Deployed: BusinessLogicFactoryFacet at 0x...
# ✅ Deployed: ProxyFactoryFacet at 0x...
# ✅ Deployed: DiamondLoupeFacet at 0x...
# ... (21 facets)
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 2: DIAMOND UPDATE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ DiamondCut executed successfully
# ✅ Registered: 150+ function selectors
#
# 🎉 Facet update completed successfully!
```

### Step 6: Verify Facet Registration

```bash
# Show all registered facets
npx hardhat showDiamondFacets --network localhost

# Expected output:
# Diamond: 0x00000000000000000000000000000000000015BE
#
# Facets:
# ┌──────────────────────────────────────┬───────────────────┐
# │ Facet                                │ Selectors         │
# ├──────────────────────────────────────┼───────────────────┤
# │ DiamondLoupeFacet                    │ 6 selectors       │
# │ DidDocumentDetailedFacet             │ 15 selectors      │
# │ DidControllerFacet                   │ 8 selectors       │
# │ TrustedIssuersRegistryFacet          │ 12 selectors      │
# │ AccessControlGovernanceFacet         │ 10 selectors      │
# │ ...                                  │ ...               │
# └──────────────────────────────────────┴───────────────────┘
```

### Step 7: Run E2E Tests

```bash
# Set environment variables
export LOCALHOST_URL=http://172.16.240.30:8545
export DIAMOND_ADDRESS=0x00000000000000000000000000000000000015BE

# Run specific E2E test
npx hardhat run test-integration/e2e/01-did-tir-integration.ts --network localhost

# Or run all integration tests
npm run test -- --network localhost
```

### Step 8: Stop Network (After Testing)

```bash
cd /path/to/isbe-network-builder/output/isbe-network-case

# Stop all Besu nodes
bash stopNetwork.sh

# Or manually:
pkill -f "besu"
docker stop $(docker ps -q --filter label=project=besu)
```

---

## Troubleshooting: Network Setup Issues

### Network Won't Start

```bash
# Check for port conflicts
netstat -tlnp | grep 8545
netstat -tlnp | grep 30303

# Check Docker containers
docker ps -a --filter label=project=besu

# Check logs
docker logs besu-node-1

# Common fix: Remove old containers
docker rm -f $(docker ps -aq --filter label=project=besu)
```

### "Execution Reverted" After updateDiamondFacets

This usually means facets weren't properly registered:

```bash
# Verify Diamond has facets
npx hardhat showDiamondFacets --network localhost

# If empty, re-run update
npx hardhat updateDiamondFacets --network localhost

# Check for errors in previous run
npx hardhat updateDiamondFacets --network localhost --dry-run
```

### Account Balance Too Low

```bash
# Check account balance
curl -X POST http://172.16.240.30:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "latest"],
    "id":1
  }'

# Expected: Large balance (ISBEADMIN account from genesis)
# If 0x0: Wrong account or genesis not loaded
```

### Wrong Chain ID

```bash
# Verify Chain ID
curl -X POST http://172.16.240.30:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected: "0x8ae" (2222 in decimal)
# If different: Update hardhat.config.ts chainId
```

---

## Quick Reference

### Critical Commands (Complete Flow)

```bash
# ═══════════════════════════════════════════════════════════════
# COMPLETE E2E TEST EXECUTION FLOW
# ═══════════════════════════════════════════════════════════════

# 1. Generate network (one-time)
cd /path/to/isbe-network-builder && ./generateAll.sh

# 2. Start network
cd output/isbe-network-case && bash startNetwork.sh

# 3. Verify network
curl -X POST http://172.16.240.30:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 4. Verify Diamond
cd /path/to/isbe-contracts
npx hardhat contract-info --address 0x...15BE --network localhost

# 5. Register facets (CRITICAL - without this, tests will fail)
npx hardhat updateDiamondFacets --network localhost

# 6. Verify registration
npx hardhat showDiamondFacets --network localhost

# 7. Run tests
export LOCALHOST_URL=http://172.16.240.30:8545
npx hardhat run test-integration/e2e/01-did-tir-integration.ts --network localhost

# 8. Stop network
cd /path/to/isbe-network-builder/output/isbe-network-case && bash stopNetwork.sh
```

### Method Signatures Reference

```solidity
// DID Registry
createDid(bytes proof, bytes32 controllerDid, bytes32 taoDid, bytes32 revisionId)
addController(bytes32 did, bytes32 controllerDid)
removeController(bytes32 did, bytes32 controllerDid)
checkController(bytes32 did, address controller) returns (bool)
getDidDocument(bytes32 did) returns (DidDocument)

// Trusted Issuers Registry
getIssuer(bytes32 did) returns (bool isTrusted, uint256 issuerType)
setAttributeMetadata(bytes32 did, uint256 issuerType, bytes32 revisionId, bytes32 taoDid, bytes32 attributeIdTao)

// DID Derivation
DID = 0x00000000000000000000000000000000000[19 bytes from keccak256(proof)]
```

### Default Addresses

```typescript
DIAMOND_ADDRESS = '0x00000000000000000000000000000000000015BE'
LOCALHOST_URL = 'http://172.16.240.30:8545'
CHAIN_ID = 2222 // localhost Besu
```
