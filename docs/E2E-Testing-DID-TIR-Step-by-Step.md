# E2E Testing: DID + TIR Integration - Step by Step Guide

## Overview

This guide provides detailed step-by-step instructions for running E2E tests for ISBE Contracts, covering network setup, governance diamond deployment, DID Registry, and Trusted Issuers Registry (TIR) integration with emphasis on role-based permissions.

---

## Phase 1: Network Setup with isbe-network-builder

### Step 1.1: Clone and Fix Submodules

```bash
# Clone the repository
git clone https://github.com/red-isbe/isbe-network-builder.git
cd isbe-network-builder

# Fix SSH to HTTPS for submodules
cat .gitmodules
sed -i 's|git@github.com:|https://github.com/|g' .gitmodules

# Sync and initialize
git submodule sync
git submodule update --init --recursive
```

### Step 1.2: Initialize Dependencies

```bash
# Run init script
./scripts/init-repo.sh
```

Expected output:

```
📁 Repository root: /tmp/e2e/isbe-network-builder
🔄 Syncing submodule configuration...
📥 Initializing and updating submodules...
✅ Submodules initialized and updated.
```

### Step 1.3: Generate Governance Diamond

```bash
# Generate genesis and deploy all governance contracts
./generateAll.sh
```

This deploys:

- 20 facets
- Governance factory
- Diamond proxy

**Critical output**:

```
✅ All 20 facets deployed successfully
Deploying diamond proxy...
✅ EIP2535AccessControl deployed at: 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d
✅ Governance system successfully deployed
✅ Governance factory deployed at: 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d
```

---

## Phase 2: Governance Diamond Address Update

### The Critical Step

**This is the most important step for E2E tests**: Updating the governance diamond from the factory address to the fixed address.

#### Pre-Update State

```
Governance contract found at address 0xc6e7df5e7b4f2a278906862b61205850344d4e7d
   changing to address 0x00000000000000000000000000000000000015BE
```

#### Post-Update State

| Aspect               | Pre-Update                                   | Post-Update                                  |
| -------------------- | -------------------------------------------- | -------------------------------------------- |
| **Factory Address**  | `0xc6e7df5e7b4f2a278906862b61205850344d4e7d` | N/A (not used)                               |
| **Diamond Address**  | N/A                                          | `0x00000000000000000000000000000000000015BE` |
| **Genesis Location** | Dynamic                                      | Fixed in genesis file                        |
| **E2E Test Use**     | ❌ Cannot use factory address                | ✅ Use `0x15BE`                              |

#### Genesis File Structure

**Location**: `/tmp/e2e/isbe-network-builder/output/genesis-case-gen.json`

**Contents**:

- Base alloc entries: 40 accounts (pre-funded)
- Contract entries: 21 (factory + 20 facets)
- Governance diamond: at fixed address `0x15BE`

#### Storage Slot Comparison

```
Pre-Update (Factory):
New contract found 0xc6e7df5e7b4f2a278906862b61205850344d4e7d
  with 335 slots modified

Post-Update (Fixed Address):
Governance contract found at address 0xc6e7df5e7b4f2a278906862b61205850344d4e7d
   changing to address 0x00000000000000000000000000000000000015BE
✅ Slot structure retrieved.----------------------------------------------------------
```

### Facet Addresses After Update

| Facet                            | Address                                      |
| -------------------------------- | -------------------------------------------- |
| BusinessLogicFactoryFacet        | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| ProxyFactoryFacet                | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| GlobalIsbePauseFacet             | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| AccessControlGovernanceFacet     | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| AccessControlDidGovernanceFacet  | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| ISBEPauseFacet                   | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| DiamondCutAccessControlFacet     | `0x0165878A594ca255338adfa4d48449f69242Eb8F` |
| DiamondLoupeFacet                | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` |
| ConfigurationManagementFacet     | `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6` |
| DidDocumentDetailedFacet         | `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318` |
| DidControllerFacet               | `0x610178dA211FEF7D417bC0e6FeD39F05609AD788` |
| DidVerificationMethodFacet       | `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e` |
| DidVerificationRelationshipFacet | `0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0` |
| DidRegistryQueryFacet            | `0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82` |
| EnsRegistryFacet                 | `0x9A676e781A523b5d0C0e43731313A708CB607508` |
| TimeStampingRegistryFacet        | `0x0B306BF915C4d645ff596e518fAf3F9669b97016` |
| ClientFilteringFacet             | `0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1` |
| NetworkDirectoryFacet            | `0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE` |
| BesuNodeManagerFacet             | `0x68B1D87F95878fE05B998F19b66F4baba5De1aed` |
| AnchoringCoreFacet               | `0x3Aa5ebB10DC797CAC828524e59A333d0A371443c` |

---

## Phase 3: Role-Based Permission Model

### Role Hierarchy

```
DEFAULT_ADMIN_ROLE (0x00...00)
    │
    ├── TRUSTED_ISSUERS_REGISTRY_ROLE
    │       │
    │       ├── Can create ROOT_TAO entries
    │       ├── Can create TI entries
    │       └── Manages Trusted Issuers Registry
    │
    └── DID_REGISTRY_ROLE
            │
            ├── Can create DID documents
            └── Manages DID Registry
```

### Role Constants

```typescript
// Role for managing Trusted Issuers Registry
const TRUSTED_ISSUERS_REGISTRY_ROLE =
    '0x851082823889050845ac21877ec718094d3f20497e34e5a8281bde69dde672e5'

// Role for managing DID Registry
const DID_REGISTRY_ROLE =
    '0x7265676973747279000000000000000000000000000000000000000000000000'

// Default admin role (full access)
const DEFAULT_ADMIN_ROLE =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
```

### Role Assignment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              ROLE ASSIGNMENT ORDER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. DEFAULT_ADMIN_ROLE                                              │
│     └─► Held by: ISBE Governance Account                            │
│         (Hardhat account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
│         Can: Grant any role, manage all facets                       │
│                                                                      │
│  2. TRUSTED_ISSUERS_REGISTRY_ROLE                                   │
│     └─► Grant to: Deployer (for E2E tests)                           │
│         Can: Create ROOT_TAO, TAO, TI entries                        │
│         Required by: setAttributeMetadata() calls                    │
│                                                                      │
│  3. TIR Trust Hierarchy (once TRUSTED_ISSUERS_REGISTRY_ROLE granted)│
│     ┌──────────────────────────────────────────────────────────┐      │
│     │ ROOT_TAO                                               │      │
│     │   └─► Created by: TRUSTED_ISSUERS_REGISTRY_ROLE holder  │      │
│     │   └─► Self-referential: taoDid = rootTaoDid            │      │
│     │                                                          │      │
│     │ TAO                                                     │      │
│     │   └─► Created by: ROOT_TAO holder                        │      │
│     │                                                          │      │
│     │ TI (Trusted Issuer)                                    │      │
│     │   └─► Created by: TAO or ROOT_TAO holder                │      │
│     └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Requirements by Operation

| Operation                             | Required Role                 | Who Performs             |
| ------------------------------------- | ----------------------------- | ------------------------ |
| `insertFirstDidDocument()`            | None (DID owner)              | Any EOA with private key |
| `grantRole(TIR_ROLE, ...)`            | DEFAULT_ADMIN_ROLE            | Governance account       |
| `setAttributeMetadata(ROOT_TAO, ...)` | TRUSTED_ISSUERS_REGISTRY_ROLE | Deployer                 |
| `setAttributeMetadata(TI, ...)`       | TRUSTED_ISSUERS_REGISTRY_ROLE | Deployer                 |
| `addController(did, controllerDid)`   | None (DID owner)              | DID owner wallet         |

---

## Phase 4: Running E2E Tests

### Environment Setup

```bash
# From isbe-contracts repository
cd /path/to/isbe-contracts

# Set environment variables
export ISBE_URL=http://localhost:8545        # For CASE network
export CHAIN_ID=11073                  # CASE network
export CURVE=secp256k1                 # Standard Ethereum curve
```

### Execute Test

```bash
# Run DID + TIR integration test
ISBE_URL=http://localhost:8545 CHAIN_ID=11073 CURVE=secp256k1 \
  npx hardhat run test-integration/e2e/01-did-tir-integration.ts --network isbe
```

---

## Phase 5: Test Execution Details

### PASO 1: Create DID for Issuer

**Actors**:

- `deployer` - Hardhat account 0 (has DEFAULT_ADMIN_ROLE)
- `issuerWallet` - Derived wallet from mnemonic (timestamp-based path)

**Roles Required**: None (DID derivation is permissionless)

**Critical Point**: Use timestamp-based derivation paths to avoid DID collisions:

```typescript
const runId = (Date.now() % 10000) + 1000 // Unique per run
const issuerPath = `m/44'/60'/0'/0/${runId}`
```

**Operation**:

```typescript
// Generate proof and derive DID
const proof = await generateProof(issuerWallet)
const issuerDid = proofToDid(proof)

// IMPORTANT: publicKey (65 bytes), NOT address (20 bytes)
const issuerPublicKey = issuerWallet.signingKey.publicKey

// Create DID document
await didRegistry.connect(issuer).insertFirstDidDocument(
    issuerDid,
    baseDocument,
    vMethodId,
    proof,
    issuerPublicKey, // 65 BYTES!
    EllipticType.SECP_256_K1,
    notBefore,
    notAfter,
    ''
)
```

### PASO 2: Create DID for Controller

**Actors**:

- `controllerWallet` - Derived wallet from mnemonic (path + 1)

**Roles Required**: None

**Funding Requirement**: Derived wallets need ETH:

```typescript
// Fund from deployer
await deployerSigner.sendTransaction({
    to: await issuerWallet.getAddress(),
    value: ethers.parseEther('1.0'),
})
await deployerSigner.sendTransaction({
    to: await controllerWallet.getAddress(),
    value: ethers.parseEther('1.0'),
})
```

### PASO 3: Configure TIR Hierarchy

**Sub-step 3.1: Grant TRUSTED_ISSUERS_REGISTRY_ROLE**

**Actor**: Deployer (holds DEFAULT_ADMIN_ROLE)

**Pre-Check**:

```typescript
let hasTirRole = await accessControl.hasRole(
    TRUSTED_ISSUERS_REGISTRY_ROLE,
    deployer.address
)
console.log('Deployer has TIR_ROLE:', hasTirRole) // false initially
```

**Grant Role**:

```typescript
if (!hasTirRole) {
    const grantTx = await accessControl.grantRole(
        TRUSTED_ISSUERS_REGISTRY_ROLE,
        deployer.address
    )
    await grantTx.wait()
}
```

**Post-Check**:

```typescript
hasTirRole = await accessControl.hasRole(
    TRUSTED_ISSUERS_REGISTRY_ROLE,
    deployer.address
)
console.log('TIR_ROLE granted:', hasTirRole) // true
```

**Sub-step 3.2: Register as ROOT_TAO**

**Actor**: Deployer (now has TRUSTED_ISSUERS_REGISTRY_ROLE)

**Operation**:

```typescript
const rootTaoRevisionId = randomBytes32()
await trustedIssuersRegistry.connect(deployer).setAttributeMetadata(
    issuerDid,
    IssuerType.ROOT_TAO,
    rootTaoRevisionId,
    ZeroHash, // Self-referential (ROOT_TAO has no parent)
    ZeroHash // No parent attribute
)
```

**Sub-step 3.3: Register as TI**

**Actor**: Deployer (has TRUSTED_ISSUERS_REGISTRY_ROLE)

**Operation**:

```typescript
const tiRevisionId = randomBytes32()
await trustedIssuersRegistry.connect(deployer).setAttributeMetadata(
    issuerDid,
    IssuerType.TI,
    tiRevisionId,
    issuerDid, // taoDid: ROOT_TAO's DID (self)
    rootTaoRevisionId // attributeIdTao: ROOT_TAO's revision
)
```

**Result**: `issuerDid` now has 2 attributes:

1. ROOT_TAO attribute
2. TI attribute (accredited by ROOT_TAO)

### PASO 4: Add Controller to DID

**Actor**: `issuerWallet` (DID owner, NOT deployer account!)

**⚠️ CRITICAL**: Connect with `issuerWallet`, NOT the `issuer` account from `getSigners()`:

```typescript
// WRONG - using hardhat account 'issuer'
await didControllerFacet.connect(issuer).addController(...)
// ❌ FAILS: issuer doesn't control the DID

// CORRECT - using derived wallet 'issuerWallet'
await didControllerFacet.connect(issuerWallet).addController(...)
// ✅ WORKS: issuerWallet controls issuerDid
```

**Operation**:

```typescript
const tx = await didControllerFacet
    .connect(issuerWallet)
    .addController(issuerDid, controllerDid)
await tx.wait()
```

### PASO 5-6: Verification

**5.1: Verify Issuer in TIR**:

```typescript
const issuerInfo = await trustedIssuersRegistry.getIssuer(issuerDid)
console.log('Issuer registered:', issuerInfo[1] > 0n) // true
console.log('Total attributes:', issuerInfo[1].toString()) // "2"
```

**5.2: Verify DID Exists**:

```typescript
const didDoc = await didRegistry.getDidDocument(issuerDid)
console.log('DID has controllers:', didDoc.controllers.length > 0) // true
```

**5.3: Verify Controllers**:

```typescript
const isController1 = await didControllerFacet[
    'checkController(bytes32,address)'
](issuerDid, await issuerWallet.getAddress())
console.log('Issuer is controller of own DID:', isController1) // true

const isController2 = await didControllerFacet[
    'checkController(bytes32,address)'
](issuerDid, await controllerWallet.getAddress())
console.log('Added controller is controller:', isController2) // true
```

---

## Phase 6: Gas Reference

| Operation                           | Gas            | Role Required                 |
| ----------------------------------- | -------------- | ----------------------------- |
| Create DID Issuer                   | ~937,828       | None                          |
| Create DID Controller               | ~920,000       | None                          |
| Grant TRUSTED_ISSUERS_REGISTRY_ROLE | ~50,000        | DEFAULT_ADMIN_ROLE            |
| Register ROOT_TAO                   | ~291,000       | TRUSTED_ISSUERS_REGISTRY_ROLE |
| Register TI                         | ~237,000       | TRUSTED_ISSUERS_REGISTRY_ROLE |
| Add Controller                      | ~156,000       | None (DID owner)              |
| **Total**                           | **~2,369,000** |                               |

---

## Phase 7: Troubleshooting

### Issue 1: DID Already Exists

**Error**: `DidAlreadyExists`

**Root Cause**: Same derivation path produces same DID

**Fix**: Use timestamp-based paths:

```typescript
const runId = (Date.now() % 10000) + 1000
const issuerPath = `m/44'/60'/0'/0/${runId}`
const controllerPath = `m/44'/60'/0'/0/${runId + 1}`
```

### Issue 2: Wrong publicKey Size

**Error**: `BytesInLengthType`

**Root Cause**: Passing `address` (20 bytes) instead of `publicKey` (65 bytes)

**Fix**:

```typescript
// WRONG
const publicKey = await issuerWallet.getAddress() // 20 bytes

// CORRECT
const publicKey = issuerWallet.signingKey.publicKey // 65 bytes
```

### Issue 3: Wrong Signer for DID Operations

**Error**: `ControllerNotAuthorized`

**Root Cause**: Using Hardhat default signers instead of derived wallets

**Fix**:

```typescript
// WRONG
await didControllerFacet.connect(issuer).addController(...)

// CORRECT
await didControllerFacet.connect(issuerWallet).addController(...)
```

### Issue 4: TIR Hierarchy Not Configured

**Error**: `SenderCannotInteractWithRootTao` or `SenderIsNotTaoOrRootTao`

**Root Cause**: Attempting to create TI without first creating ROOT_TAO

**Fix**: Order matters:

1. Grant `TRUSTED_ISSUERS_REGISTRY_ROLE`
2. Create `ROOT_TAO`
3. Create `TI`

### Issue 5: Insufficient Funds

**Error**: Transaction fails due to insufficient gas

**Fix**: Fund derived wallets:

```typescript
await deployerSigner.sendTransaction({
    to: await issuerWallet.getAddress(),
    value: ethers.parseEther('1.0'),
})
```

### Issue 6: Role Not Granted

**Error**: `AccessControl: account <address> is missing role <role>`

**Fix**: Check and grant:

```typescript
if (!(await accessControl.hasRole(TIR_ROLE, deployer.address))) {
    await accessControl.grantRole(TIR_ROLE, deployer.address)
}
```

---

## Checklist Before Running Tests

- [ ] `isbe-network-builder` cloned and initialized
- [ ] Submodules synced (SSH→HTTPS fix applied)
- [ ] `./scripts/init-repo.sh` executed
- [ ] `./generateAll.sh` executed
- [ ] **Governance diamond updated to `0x15BE`**
- [ ] **TRUSTED_ISSUERS_REGISTRY_ROLE granted to deployer**
- [ ] **ROOT_TAO created before TI**
- [ ] **DID owner wallet (issuerWallet) used for addController**
- [ ] Environment variables set (`ISBE_URL`, `CHAIN_ID`, `CURVE`)
- [ ] Network accessible at specified URL

---

## References

- [DID Registry Contract](../contracts/identity/didregistry/)
- [Trusted Issuers Registry Contract](../contracts/identity/trustedissuersregistry/)
- [CLAUDE.md - Project Conventions](../CLAUDE.md)
- [Governance Layer Architecture](./Governance-Layer-Architecture.md)
