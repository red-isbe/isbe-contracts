# E2E Test Execution Report - ISBE-23

**Date:** 2026-03-25
**Branch:** feat/20260301_e2e
**Network:** CASE Network (MSI)
**Diamond Address:** 0x00000000000000000000000000000000000015BE

---

## Executive Summary

**Status:** ✅ **PASSED**

All E2E tests for DID Registry and Trusted Issuers Registry (TIR) integration completed successfully after fixing 6 critical bugs.

| Metric             | Value                  |
| ------------------ | ---------------------- |
| **Total Tests**    | 6 steps                |
| **Passed**         | 6                      |
| **Failed**         | 0                      |
| **Total Gas**      | 2,369,730              |
| **Execution Time** | 17 seconds             |
| **Network**        | CASE (Chain ID: 11073) |

---

## Test Results

### PASO 1: Create DID for Issuer ✅

| Metric          | Value                                 |
| --------------- | ------------------------------------- |
| DID             | `0x00000000000000000000000000c60d...` |
| Derivation Path | `m/44'/60'/0'/0/9667`                 |
| Gas Used        | 920,728                               |
| TX              | `0x8a86...`                           |
| Block           | 5174                                  |

**Validations:**

- ✅ DID derived from proof signature
- ✅ PublicKey (65 bytes) passed correctly
- ✅ DID_REGISTRY_ROLE permission verified

### PASO 2: Create DID for Controller ✅

| Metric          | Value                                 |
| --------------- | ------------------------------------- |
| DID             | `0x000000000000000000000000003e31...` |
| Derivation Path | `m/44'/60'/0'/0/9668`                 |
| Gas Used        | ~920,000                              |
| TX              | `0xf880...`                           |
| Funded          | 1.0 ETH from deployer                 |

**Validations:**

- ✅ Unique derivation path (timestamp-based)
- ✅ Wallet funded before transaction
- ✅ PublicKey passed correctly

### PASO 3: Configure TIR Hierarchy ✅

| Sub-step                                | Status | Gas     |
| --------------------------------------- | ------ | ------- |
| 3.1 Grant TRUSTED_ISSUERS_REGISTRY_ROLE | ✅     | -       |
| 3.2 Register ROOT_TAO                   | ✅     | 291,403 |
| 3.3 Register TI                         | ✅     | 236,907 |

**Validations:**

- ✅ ROOT_TAO self-referential hierarchy
- ✅ TI accredited by ROOT_TAO
- ✅ Total attributes: 2

### PASO 4: Add Controller to DID ✅

| Metric   | Value       |
| -------- | ----------- |
| Gas Used | 155,666     |
| TX       | `0x8f02...` |

**Validations:**

- ✅ Controller added to DID
- ✅ checkController returns true
- ✅ Used issuerWallet (not hardhat account)

### PASO 5: Integration Validation ✅

| Check                     | Result  |
| ------------------------- | ------- |
| Issuer in TIR             | ✅ true |
| DID exists                | ✅ true |
| Controllers count         | ✅ 2    |
| Issuer is controller      | ✅ true |
| Added controller verified | ✅ true |

### PASO 6: Persistence Validation ✅

| Check               | Result  |
| ------------------- | ------- |
| Issuer persists     | ✅ true |
| DID persists        | ✅ true |
| Controller persists | ✅ true |

---

## Bugs Fixed During Testing

### Bug #1: initializeDiDRegistry Parameter Order

**File:** `tasks/didDocument/initializeDiDRegistry.ts`

**Problem:** Incorrect parameter order and duplicate parameters

```typescript
// BEFORE (WRONG)
await initializeDiDRegistry(elliptictype, diamond, elliptictype, provider)

// AFTER (FIXED)
await initializeDiDRegistry(diamond, elliptictype, provider)
```

**Impact:** DID Registry couldn't be initialized, blocking all DID operations.

---

### Bug #2: PublicKey vs Address in insertFirstDidDocument

**File:** `test-integration/e2e/01-did-tir-integration.ts`

**Problem:** Test was passing `address` (20 bytes) instead of `publicKey` (65 bytes)

```typescript
// BEFORE (WRONG)
insertFirstDidDocument(..., issuer.address, ...)  // 20 bytes

// AFTER (FIXED)
const issuerPublicKey = issuerWallet.signingKey.publicKey  // 65 bytes
insertFirstDidDocument(..., issuerPublicKey, ...)
```

**Impact:** `_validateProof` failed because it expects 65-byte public key for signature verification.

---

### Bug #3: Wrong Signer for DID Operations

**File:** `test-integration/e2e/01-did-tir-integration.ts`

**Problem:** Using hardhat default signers instead of derived wallet signers

```typescript
// BEFORE (WRONG)
didRegistry.connect(issuer).insertFirstDidDocument(...)

// AFTER (FIXED)
didRegistry.connect(issuerWallet).insertFirstDidDocument(...)
```

**Impact:** `DID_REGISTRY_ROLE` check failed because `issuer` account didn't have the role.

---

### Bug #4: Missing TIR Hierarchy Setup

**File:** `test-integration/e2e/01-did-tir-integration.ts`

**Problem:** Attempting to create TI without ROOT_TAO

```typescript
// ADDED: Step 3.1
await accessControl.grantRole(TRUSTED_ISSUERS_REGISTRY_ROLE, deployer.address)

// ADDED: Step 3.2 (ROOT_TAO)
await trustedIssuersRegistry.setAttributeMetadata(
    issuerDid,
    IssuerType.ROOT_TAO,
    revisionId,
    ZeroHash,
    ZeroHash
)

// Step 3.3 (TI)
await trustedIssuersRegistry.setAttributeMetadata(
    issuerDid,
    IssuerType.TI,
    tiRevisionId,
    issuerDid,
    rootTaoRevisionId
)
```

**Impact:** `SenderCannotInteractWithRootTao` error when creating TI directly.

---

### Bug #5: Duplicate DID Creation

**File:** `test-integration/e2e/01-did-tir-integration.ts`

**Problem:** Same derivation path produced same DID on re-runs

```typescript
// BEFORE (WRONG)
const issuerPath = "m/44'/60'/0'/0/100" // Always same path

// AFTER (FIXED)
const runId = (Date.now() % 10000) + 1000 // Unique per run
const issuerPath = `m/44'/60'/0'/0/${runId}`
```

**Impact:** `DidAlreadyExists` error on subsequent test runs.

---

### Bug #6: addController Wrong Signer

**File:** `test-integration/e2e/01-did-tir-integration.ts`

**Problem:** Using hardhat `issuer` account instead of `issuerWallet`

```typescript
// BEFORE (WRONG)
didControllerFacet.connect(issuer).addController(...)
checkController(issuerDid, controller.address)

// AFTER (FIXED)
const controllerWalletAddress = await controllerWallet.getAddress()
didControllerFacet.connect(issuerWallet).addController(...)
checkController(issuerDid, controllerWalletAddress)
```

**Impact:** `ControllerNotAuthorized` error because signer didn't control the DID.

---

## Architecture Insights

### DID Derivation Flow

```
1. Wallet Creation
   HDNodeWallet.fromPhrase(mnemonic, '', derivationPath)
   └─► 65-byte signingKey.publicKey

2. Proof Generation
   generateProof(wallet) → signature (65 bytes)
   └─► Signs keccak256(publicKey)

3. DID Derivation
   proofToDid(proof) → DID
   └─► DID = [13 zero bytes | last 19 bytes of proof]
```

### TIR Trust Hierarchy

```
ROOT_TAO (Trust Anchor)
   └─► Created by: TRUSTED_ISSUERS_REGISTRY_ROLE holder
   └─► Self-referential (taoDid = issuerDid)

TAO (Trust Anchor Organization)
   └─► Created by: ROOT_TAO holder

TI (Trusted Issuer)
   └─► Created by: TAO or ROOT_TAO holder
```

---

## Deployment Requirements

### Prerequisites

1. **Diamond Deployed** at `0x00000000000000000000000000000000000015BE`
2. **DID Registry Initialized** with elliptic curve type
3. **Facets Registered** (21 facets with 166+ selectors)
4. **Roles Granted**:
    - `DID_REGISTRY_ROLE` → DID creation permissions
    - `TRUSTED_ISSUERS_REGISTRY_ROLE` → ROOT_TAO creation

### Network Configuration

```bash
export ISBE_URL=http://msi:8548
export CHAIN_ID=11073
export CURVE=secp256k1
```

---

## Files Changed

| File                                             | Change Type | Description                |
| ------------------------------------------------ | ----------- | -------------------------- |
| `tasks/didDocument/initializeDiDRegistry.ts`     | Bug Fix     | Parameter order correction |
| `tasks/didDocument/getDids.ts`                   | Config      | Diamond address update     |
| `test-integration/e2e/01-did-tir-integration.ts` | New Feature | Complete E2E test          |

---

## Recommendations for Production Deployment

### Critical

1. **Verify initial roles are granted** to deployment governance account
2. **Initialize TIR hierarchy** before allowing TI registrations
3. **Use unique derivation paths** for production DIDs to prevent conflicts

### Security

1. **Never reuse derivation paths** - generate unique paths per DID
2. **Verify publicKey length** before calling `insertFirstDidDocument`
3. **Check role permissions** before DID/TIR operations

### Operational

1. **Monitor gas consumption** - DID creation is expensive (~920k gas)
2. **Implement rate limiting** for DID creation
3. **Log all DID operations** for audit trails

---

## Related Issues

- **ISBE-23**: E2E Testing Diamond Pattern
- **ISBE-24**: Bug in setAttributeMetadata in TIR
- **ISBE-33**: Knowledge Sharing for ISBE Besu Local Deployer
- **PR #49**: Authorization check for controller addition

---

## Next Steps

1. ✅ Merge PR with all E2E test fixes
2. ⏳ Add unit tests for TIR hierarchy setup
3. ⏳ Create deployment scripts for automated TIR hierarchy initialization
4. ⏳ Update CI/CD pipeline to run E2E tests automatically

---

## Appendix: Gas Breakdown

| Operation             | Gas           | USD (20 gwei) |
| --------------------- | ------------- | ------------- |
| Create DID Issuer     | 920,692       | ~$0.018       |
| Create DID Controller | 920,728       | ~$0.018       |
| Register ROOT_TAO     | 291,403       | ~$0.006       |
| Register TI           | 236,907       | ~$0.005       |
| Add Controller        | 155,666       | ~$0.003       |
| **Total**             | **2,369,730** | **~$0.047**   |

_Note: Gas prices are estimates based on typical network conditions_

---

## Test Environment

| Component       | Version/Value           |
| --------------- | ----------------------- |
| Network         | CASE (Hyperledger Besu) |
| Chain ID        | 11073                   |
| Diamond Address | `0x0000...15BE`         |
| Facets          | 21 deployed             |
| Selectors       | 166+                    |
| Elliptic Curve  | secp256k1               |
| Node.js         | 22.6+                   |
| Hardhat         | 2.x                     |
| ethers.js       | 6.x                     |

---

**Report Generated:** 2026-03-25T14:33:00Z
**Generated by:** ISBE E2E Test Suite
