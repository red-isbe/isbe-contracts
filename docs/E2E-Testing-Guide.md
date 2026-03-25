# E2E Testing Guide - ISBE Contracts

## Quick Start

For detailed step-by-step instructions with role-based permissions and governance diamond update, see **[E2E Testing: DID + TIR Integration - Step by Step Guide](./E2E-Testing-DID-TIR-Step-by-Step.md)**.

## Prerequisites

1. **Network Running**: `isbe-network-builder` with governance diamond deployed
2. **Diamond Address**: `0x00000000000000000000000000000000000015BE`
3. **Environment Variables**:
    ```bash
    export ISBE_URL=http://localhost:8545
    export CHAIN_ID=11073
    export CURVE=secp256k1
    ```

## Running Tests

```bash
# From isbe-contracts repository
cd test-integration/e2e

# Run DID + TIR integration test
ISBE_URL=http://localhost:8545 CHAIN_ID=11073 CURVE=secp256k1 \
  npx hardhat run 01-did-tir-integration.ts --network isbe
```

## Test Flow

```
PASO 1: Create DID for Issuer
  └─► Derive DID from proof (timestamp-based path)
  └─► Use publicKey (65 bytes), NOT address (20 bytes)
  └─► Gas: ~937,828

PASO 2: Create DID for Controller
  └─► Fund derived wallets from deployer
  └─► Gas: ~920,000

PASO 3: Configure TIR Hierarchy
  ├─► 3.1: Grant TRUSTED_ISSUERS_REGISTRY_ROLE to deployer
  ├─► 3.2: Register issuer as ROOT_TAO
  └─► 3.3: Register issuer as TI (accredited by ROOT_TAO)
  └─► Gas: ~291,000 + ~237,000

PASO 4: Add Controller to DID
  └─► Use issuerWallet (NOT deployer account!)
  └─► Gas: ~156,000

PASO 5-6: Verification and Persistence
  └─► Verify issuer in TIR
  └─► Verify DID exists
  └─► Verify controllers
```

## Role-Based Permissions

| Role                            | Who Holds            | What It Allows              |
| ------------------------------- | -------------------- | --------------------------- |
| `DEFAULT_ADMIN_ROLE`            | Governance account   | Grant any role              |
| `TRUSTED_ISSUERS_REGISTRY_ROLE` | Deployer (for tests) | Create ROOT_TAO, TI entries |
| `DID_REGISTRY_ROLE`             | Deployer             | Create DID documents        |

**Critical**: Role assignment order matters:

1. Grant `TRUSTED_ISSUERS_REGISTRY_ROLE`
2. Create `ROOT_TAO`
3. Create `TI`

## Common Errors

| Error                             | Root Cause           | Fix                              |
| --------------------------------- | -------------------- | -------------------------------- |
| `DidAlreadyExists`                | Same derivation path | Use timestamp-based paths        |
| `BytesInLengthType`               | Wrong parameter size | Use `publicKey` (65 bytes)       |
| `ControllerNotAuthorized`         | Wrong signer         | Use `issuerWallet`, not `issuer` |
| `SenderCannotInteractWithRootTao` | No ROOT_TAO created  | Create ROOT_TAO first            |
| `AccessControl: missing role`     | Role not granted     | Check role assignment            |

## Gas Reference

| Operation             | Gas            | Role Required                 |
| --------------------- | -------------- | ----------------------------- |
| Create DID Issuer     | ~937,828       | None                          |
| Create DID Controller | ~920,000       | None                          |
| Grant TIR Role        | ~50,000        | DEFAULT_ADMIN_ROLE            |
| Register ROOT_TAO     | ~291,000       | TRUSTED_ISSUERS_REGISTRY_ROLE |
| Register TI           | ~237,000       | TRUSTED_ISSUERS_REGISTRY_ROLE |
| Add Controller        | ~156,000       | None (DID owner)              |
| **Total**             | **~2,369,000** |                               |

## Detailed Documentation

For complete step-by-step instructions including:

- Network setup with `isbe-network-builder`
- Governance diamond address update (pre vs post)
- Role-based permission model
- Troubleshooting guide

See **[E2E Testing: DID + TIR Integration - Step by Step Guide](./E2E-Testing-DID-TIR-Step-by-Step.md)**.
