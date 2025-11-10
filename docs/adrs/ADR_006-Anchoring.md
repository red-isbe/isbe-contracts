# ADR-006: Cross-Chain Block Anchoring

## Table of Contents

- [Status](#status)
- [Context](#context)
- [Decision](#decision)
- [Storage Layout](#storage-layout)
- [API Overview](#api-overview)
- [Key Invariants](#key-invariants)
- [Deployment](#deployment)
- [References](#references)

## Status

Proposal

## Context

Cross-chain interoperability requires verifiable proof that events occurred on external blockchains. The Anchoring system stores block metadata (blockNumber, blockHash, stateRoot) from external chains, enabling state proof validation and transaction inclusion proofs.

## Decision

Implement `contracts/factory/anchoring/*` as part of Governance Diamond following ISBE architecture:

- **Multi-chain support** via EIP-155 chain IDs
- **EIP-7201 namespaced storage** at `_ANCHORING_STORAGE_POSITION`
- **Role-based access control** (ANCHORER_ROLE, METADATA_MANAGER_ROLE)
- **Monotonic anchoring** per chain (strictly increasing block numbers)
- **Batch operations** for gas efficiency
- **Deployed as facet** in Governance Diamond

## Storage Layout

```solidity
/// @notice Per-chain anchoring data
struct ChainAnchoringData {
    BlockInfo[] anchoredBlocks;
    mapping(uint256 => BlockInfo) blockByNumber;
    mapping(uint256 => bool) isAnchored;
    uint256 lastAnchoredBlock;
    uint256 totalAnchors;
    bool isRegistered;
}

/// @notice EIP-7201 namespaced storage
struct AnchoringStorage {
    uint256 thisChainId;
    mapping(uint256 => ChainAnchoringData) anchoredChains;
    uint256[] registeredChainIds;
    bool initialized;
}

struct BlockInfo {
    uint256 blockNumber;
    bytes32 blockHash;
    bytes32 stateRoot;
    uint256 timestamp;
    uint256 chainId;
    address anchorer;
}
```

**Design:**

- Multi-chain support via `mapping(uint256 => ChainAnchoringData)`
- Per-chain isolation (independent `lastAnchoredBlock`, `totalAnchors`)
- Chain registration required before anchoring
- Dual indexing: array (chronological) + mapping (O(1) lookup)

## API Overview

### Initialization & Chain Management

```solidity
function initializeAnchoringCore(
    uint256 _thisChainId,
    uint256 _anchoredChainId
) external;
function registerChain(uint256 _chainId) external; // METADATA_MANAGER_ROLE
function updateChainMetadata(uint256 _thisChainId) external; // METADATA_MANAGER_ROLE
```

### Anchoring Operations

```solidity
function anchorBlock(
    uint256 _chainId,
    uint256 _blockNumber,
    bytes32 _blockHash,
    bytes32 _stateRoot
) external; // ANCHORER_ROLE

function anchorBlocksBatch(
    uint256 _chainId,
    uint256[] calldata _blockNumbers,
    bytes32[] calldata _blockHashes,
    bytes32[] calldata _stateRoots
) external; // ANCHORER_ROLE
```

### View Functions

```solidity
function getLastAnchoredBlock(
    uint256 _chainId
) external view returns (BlockInfo memory);
function getAnchoredBlock(
    uint256 _chainId,
    uint256 _blockNumber
) external view returns (BlockInfo memory);
function isBlockAnchored(
    uint256 _chainId,
    uint256 _blockNumber
) external view returns (bool);
function getLastNBlocks(
    uint256 _chainId,
    uint256 _count
) external view returns (BlockInfo[] memory);
function getBlocksInRange(
    uint256 _chainId,
    uint256 _fromBlock,
    uint256 _toBlock
) external view returns (BlockInfo[] memory);
function getAnchoringStats(
    uint256 _chainId
) external view returns (uint256, uint256, uint256, uint256);
function getChainMetadata() external view returns (uint256, uint256[] memory);
```

## Key Invariants

1. **Chain Registration**: Chains must be registered before anchoring
2. **Per-Chain Uniqueness**: Block number anchored once per chain
3. **Per-Chain Monotonicity**: Strictly increasing block numbers per chain (when totalAnchors > 0)
4. **Pause**: Anchoring blocked when paused, views always accessible
5. **Chain ID Validity**: Non-zero chain IDs
6. **Multi-Chain Isolation**: Independent anchoring state per chain

## Deployment

### Governance Diamond Integration

1. Deploy `AnchoringCoreFacet` to factory:

```typescript
await governanceFactory.deploy(
    ANCHORING_CORE_RESOLVER_KEY,
    AnchoringCoreFacet.bytecode
)
```

2. Add facet via DiamondCut:

```typescript
const anchoringFacetAddress = await governanceFactory.getBusinessLogicAddress(
    ANCHORING_CORE_RESOLVER_KEY,
    0
)
await governanceDiamond.diamondCut(
    [
        {
            facetAddress: anchoringFacetAddress,
            action: FacetCutAction.Add,
            functionSelectors: selectors,
        },
    ],
    ethers.constants.AddressZero,
    '0x'
)
```

3. Initialize with first chain:

```typescript
await governanceDiamond.initializeAnchoringCore(1234, 1) // thisChainId, anchoredChainId
```

4. Grant roles:

```typescript
await governanceDiamond.grantRole(ANCHORER_ROLE, anchorerServiceAddress)
await governanceDiamond.grantRole(METADATA_MANAGER_ROLE, adminMultisig)
```

5. Register additional chains:

```typescript
await governanceDiamond.registerChain(137) // Polygon
await governanceDiamond.registerChain(56) // BSC
```

## References

**Contracts**:

- `contracts/factory/anchoring/IAnchoringCore.sol` - Interface
- `contracts/factory/anchoring/AnchoringCore.sol` - Public API
- `contracts/factory/anchoring/AnchoringCoreInternal.sol` - Internal logic
- `contracts/factory/anchoring/AnchoringCoreFacet.sol` - Diamond facet

**Constants** (`contracts/constants/`):

- `roles.sol`: `_ANCHORER_ROLE`, `_METADATA_MANAGER_ROLE`
- `resolverKeys.sol`: `_ANCHORING_CORE_RESOLVER_KEY`
- `storagePositions.sol`: `_ANCHORING_STORAGE_POSITION`

**Tests**: `test/governance/Anchoring.spec.ts`

**Standards**: EIP-2535, EIP-7201, EIP-165, EIP-155
