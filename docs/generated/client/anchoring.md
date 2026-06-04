## AnchoringCore

Manages cross-chain block anchoring with multi-chain support

_This contract serves as the public-facing entry point for anchoring
     block metadata from external blockchains. It implements the `IAnchoringCore`
     interface and inherits core anchoring logic from `AnchoringCoreInternal`.
     Access to state-changing functions is restricted by role-based access control._

### registerChain

```solidity
function registerChain(uint256 _chainId) external
```

Registers a new chain for anchoring

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to register (EIP-155) |

### anchorBlock

```solidity
function anchorBlock(uint256 _chainId, uint256 _blockNumber, bytes32 _blockHash, bytes32 _stateRoot) external
```

Anchors a single block from an external chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID of the external chain (EIP-155) |
| _blockNumber | uint256 | Block number from external chain |
| _blockHash | bytes32 | Block hash from external chain |
| _stateRoot | bytes32 | State root from external chain |

### anchorBlocksBatch

```solidity
function anchorBlocksBatch(uint256 _chainId, uint256[] _blockNumbers, bytes32[] _blockHashes, bytes32[] _stateRoots) external
```

Anchors multiple blocks in a single transaction (batch operation)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID of the external chain (EIP-155) |
| _blockNumbers | uint256[] | Array of block numbers |
| _blockHashes | bytes32[] | Array of block hashes |
| _stateRoots | bytes32[] | Array of state roots |

### getLastAnchoredBlock

```solidity
function getLastAnchoredBlock(uint256 _chainId) external view returns (struct BlockInfo)
```

Gets the last anchored block for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo | BlockInfo struct with block details |

### getAnchoredBlock

```solidity
function getAnchoredBlock(uint256 _chainId, uint256 _blockNumber) external view returns (struct BlockInfo)
```

Gets information about a specific anchored block

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |
| _blockNumber | uint256 | Block number to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo | BlockInfo struct with block details |

### isBlockAnchored

```solidity
function isBlockAnchored(uint256 _chainId, uint256 _blockNumber) external view returns (bool)
```

Checks if a block has been anchored for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to check |
| _blockNumber | uint256 | Block number to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if block is anchored, false otherwise |

### getLastNBlocks

```solidity
function getLastNBlocks(uint256 _chainId, uint256 _count) external view returns (struct BlockInfo[])
```

Gets the last N anchored blocks for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |
| _count | uint256 | Number of blocks to retrieve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo[] | Array of BlockInfo structs |

### getBlocksInRange

```solidity
function getBlocksInRange(uint256 _chainId, uint256 _fromBlock, uint256 _toBlock) external view returns (struct BlockInfo[])
```

Gets blocks within a specific range for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |
| _fromBlock | uint256 | Starting block number |
| _toBlock | uint256 | Ending block number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo[] | Array of BlockInfo structs |

### getAnchoringStats

```solidity
function getAnchoringStats(uint256 _chainId) external view returns (uint256 _totalAnchors, uint256 _lastAnchoredBlock, uint256 _thisChainId, uint256 _anchoredChainId)
```

Gets system statistics for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _totalAnchors | uint256 | Total number of anchored blocks |
| _lastAnchoredBlock | uint256 | Last anchored block number |
| _thisChainId | uint256 | Chain ID of this blockchain (EIP-155) |
| _anchoredChainId | uint256 | Chain ID being queried (EIP-155) |

### getChainMetadata

```solidity
function getChainMetadata() external view returns (uint256 _thisChainId, uint256[] _registeredChainIds)
```

Gets chain metadata including all registered chains

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _thisChainId | uint256 | Chain ID of this blockchain (EIP-155) |
| _registeredChainIds | uint256[] | Array of all registered chain IDs |

### getRegisteredChains

```solidity
function getRegisteredChains(uint256 _pageIndex, uint256 _pageLength) external view returns (uint256 _thisChainId, uint256[] _registeredChainIds)
```

Gets paginated list of registered chain IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pageIndex | uint256 | Zero-based page index |
| _pageLength | uint256 | Number of items per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _thisChainId | uint256 | Chain ID of this blockchain (EIP-155) |
| _registeredChainIds | uint256[] | Paginated array of registered chain IDs |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```



---

## AnchoringCoreFacet

Diamond facet for cross-chain anchoring functionality

_Provides cross-chain block anchoring capabilities within the Diamond architecture,
     enabling the diamond to securely anchor and retrieve block metadata from multiple external chains.
     Implements IEIP2535Introspection for diamond introspection and function selector discovery._

### constructor

```solidity
constructor() public
```

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## AnchoringCoreInternal

Internal implementation of anchoring functionality

_Provides core functionality for multi-chain block anchoring with optimized storage management.
     Each chain maintains its own independent anchoring history with enforced sequential block ordering.
     Supports efficient queries for block retrieval, range queries, and pagination across multiple chains._

### ChainAnchoringData

Per-chain anchoring data

```solidity
struct ChainAnchoringData {
  mapping(uint256 => struct BlockInfo) blockByNumber;
  struct EnumerableSet.UintSet anchoredBlockNumbers;
}
```

### AnchoringStorage

Storage structure for multi-chain anchoring datas

```solidity
struct AnchoringStorage {
  mapping(uint256 => struct AnchoringCoreInternal.ChainAnchoringData) anchoredChains;
  struct EnumerableSet.UintSet registeredChainIds;
}
```

### onlyUnregisteredChain

```solidity
modifier onlyUnregisteredChain(uint256 _chainId)
```

### onlyRegisteredChain

```solidity
modifier onlyRegisteredChain(uint256 _chainId)
```

### _registerChain

```solidity
function _registerChain(uint256 _chainId) internal
```

### _anchorBlock

```solidity
function _anchorBlock(uint256 _chainId, uint256 _blockNumber, bytes32 _blockHash, bytes32 _stateRoot, address _anchorer) internal returns (uint256 timestamp_)
```

### _anchorBlocksBatchInternal

```solidity
function _anchorBlocksBatchInternal(uint256 _chainId, uint256[] _blockNumbers, bytes32[] _blockHashes, bytes32[] _stateRoots, uint256 _length, address _anchorer) internal returns (uint256 timestamp_)
```

### _getLastAnchoredBlock

```solidity
function _getLastAnchoredBlock(uint256 _chainId) internal view returns (struct BlockInfo blockInfo_)
```

### _getAnchoredBlock

```solidity
function _getAnchoredBlock(uint256 _chainId, uint256 _blockNumber) internal view returns (struct BlockInfo blockInfo_)
```

### _isBlockAnchored

```solidity
function _isBlockAnchored(uint256 _chainId, uint256 _blockNumber) internal view returns (bool)
```

### _getLastNBlocks

```solidity
function _getLastNBlocks(uint256 _chainId, uint256 _count) internal view returns (struct BlockInfo[] blockInfos_)
```

### _getBlocksInRange

```solidity
function _getBlocksInRange(uint256 _chainId, uint256 _fromBlock, uint256 _toBlock) internal view returns (struct BlockInfo[] blockInfos_)
```

### _getAnchoringStats

```solidity
function _getAnchoringStats(uint256 _chainId) internal view returns (uint256 totalAnchors_, uint256 lastAnchoredBlock_, uint256 thisChainId_, uint256 anchoredChainId_)
```

### _getChainMetadata

```solidity
function _getChainMetadata() internal view returns (uint256 _thisChainId, uint256[] _registeredChainIds)
```

### _getRegisteredChains

```solidity
function _getRegisteredChains(uint256 _pageIndex, uint256 _pageLength) internal view returns (uint256 _thisChainId, uint256[] _registeredChainIds)
```

### _checkBlockSequential

```solidity
function _checkBlockSequential(uint256 _chainId, uint256 _blockNumber) internal view
```

### _checkRegisteredChain

```solidity
function _checkRegisteredChain(uint256 _chainId) internal view
```

### _checkBlocksBatch

```solidity
function _checkBlocksBatch(uint256 _chainId, uint256[] _blockNumbers) internal view
```

### _checkBlockNotAnchored

```solidity
function _checkBlockNotAnchored(uint256 _chainId, uint256 _blockNumber) internal view
```

### _getBlockInfo

```solidity
function _getBlockInfo(uint256 _chainId, uint256 _blockNumber) internal view returns (struct BlockInfo)
```



---

## IAnchoringCore

### BlockAnchored

```solidity
event BlockAnchored(uint256 blockNumber, bytes32 blockHash, bytes32 stateRoot, uint256 chainId, uint256 timestamp, address anchorer)
```

Emitted when a single block is anchored

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| blockNumber | uint256 | Block number that was anchored |
| blockHash | bytes32 | Block hash |
| stateRoot | bytes32 | State root of the block |
| chainId | uint256 | Chain ID of the external chain (EIP-155) |
| timestamp | uint256 | When the block was anchored |
| anchorer | address | Address that performed the anchoring |

### BlocksBatchAnchored

```solidity
event BlocksBatchAnchored(uint256 chainId, uint256 blockCount, uint256 firstBlock, uint256 lastBlock, uint256 timestamp, address anchorer)
```

Emitted when multiple blocks are anchored in a batch operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| chainId | uint256 | Chain ID of the external chain (EIP-155) |
| blockCount | uint256 | Number of blocks anchored in this batch |
| firstBlock | uint256 | First block number in the batch |
| lastBlock | uint256 | Last block number in the batch |
| timestamp | uint256 | When the batch was anchored |
| anchorer | address | Address that performed the anchoring |

### ChainRegistered

```solidity
event ChainRegistered(uint256 chainId, address registrar)
```

Emitted when a new chain is registered for anchoring

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| chainId | uint256 | Chain ID that was registered (EIP-155) |
| registrar | address | Address that registered the chain |

### BlockAlreadyAnchored

```solidity
error BlockAlreadyAnchored(uint256 blockNumber)
```

Thrown when trying to anchor a block that's already anchored

### BlockNumberMustBeHigher

```solidity
error BlockNumberMustBeHigher(uint256 provided, uint256 required)
```

Thrown when block number is not sequential

### BlockNotFound

```solidity
error BlockNotFound(uint256 blockNumber)
```

Thrown when querying a non-existent block

### NoBlocksAnchored

```solidity
error NoBlocksAnchored()
```

Thrown when no blocks have been anchored yet

### InvalidCount

```solidity
error InvalidCount()
```

Thrown when invalid count parameter is provided

### ChainNotRegistered

```solidity
error ChainNotRegistered(uint256 chainId)
```

Thrown when trying to use an unregistered chain

### ChainAlreadyRegistered

```solidity
error ChainAlreadyRegistered(uint256 chainId)
```

Thrown when trying to register an already registered chain

### InvalidRange

```solidity
error InvalidRange()
```

Thrown when invalid range is provided

### ArrayLengthMismatch

```solidity
error ArrayLengthMismatch()
```

Thrown when array lengths don't match in batch operations

### registerChain

```solidity
function registerChain(uint256 _chainId) external
```

Registers a new chain for anchoring

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to register (EIP-155) |

### anchorBlock

```solidity
function anchorBlock(uint256 _chainId, uint256 _blockNumber, bytes32 _blockHash, bytes32 _stateRoot) external
```

Anchors a single block from an external chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID of the external chain (EIP-155) |
| _blockNumber | uint256 | Block number from external chain |
| _blockHash | bytes32 | Block hash from external chain |
| _stateRoot | bytes32 | State root from external chain |

### anchorBlocksBatch

```solidity
function anchorBlocksBatch(uint256 _chainId, uint256[] _blockNumbers, bytes32[] _blockHashes, bytes32[] _stateRoots) external
```

Anchors multiple blocks in a single transaction (batch operation)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID of the external chain (EIP-155) |
| _blockNumbers | uint256[] | Array of block numbers |
| _blockHashes | bytes32[] | Array of block hashes |
| _stateRoots | bytes32[] | Array of state roots |

### getLastAnchoredBlock

```solidity
function getLastAnchoredBlock(uint256 _chainId) external view returns (struct BlockInfo)
```

Gets the last anchored block for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo | BlockInfo struct with block details |

### getAnchoredBlock

```solidity
function getAnchoredBlock(uint256 _chainId, uint256 _blockNumber) external view returns (struct BlockInfo)
```

Gets information about a specific anchored block

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |
| _blockNumber | uint256 | Block number to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo | BlockInfo struct with block details |

### isBlockAnchored

```solidity
function isBlockAnchored(uint256 _chainId, uint256 _blockNumber) external view returns (bool)
```

Checks if a block has been anchored for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to check |
| _blockNumber | uint256 | Block number to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if block is anchored, false otherwise |

### getLastNBlocks

```solidity
function getLastNBlocks(uint256 _chainId, uint256 _count) external view returns (struct BlockInfo[])
```

Gets the last N anchored blocks for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |
| _count | uint256 | Number of blocks to retrieve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo[] | Array of BlockInfo structs |

### getBlocksInRange

```solidity
function getBlocksInRange(uint256 _chainId, uint256 _fromBlock, uint256 _toBlock) external view returns (struct BlockInfo[])
```

Gets blocks within a specific range for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |
| _fromBlock | uint256 | Starting block number |
| _toBlock | uint256 | Ending block number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct BlockInfo[] | Array of BlockInfo structs |

### getAnchoringStats

```solidity
function getAnchoringStats(uint256 _chainId) external view returns (uint256 _totalAnchors, uint256 _lastAnchoredBlock, uint256 _thisChainId, uint256 _anchoredChainId)
```

Gets system statistics for a specific chain

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chainId | uint256 | Chain ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _totalAnchors | uint256 | Total number of anchored blocks |
| _lastAnchoredBlock | uint256 | Last anchored block number |
| _thisChainId | uint256 | Chain ID of this blockchain (EIP-155) |
| _anchoredChainId | uint256 | Chain ID being queried (EIP-155) |

### getChainMetadata

```solidity
function getChainMetadata() external view returns (uint256 _thisChainId, uint256[] _registeredChainIds)
```

Gets chain metadata including all registered chains

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _thisChainId | uint256 | Chain ID of this blockchain (EIP-155) |
| _registeredChainIds | uint256[] | Array of all registered chain IDs |

### getRegisteredChains

```solidity
function getRegisteredChains(uint256 _pageIndex, uint256 _pageLength) external view returns (uint256 _thisChainId, uint256[] _registeredChainIds)
```

Gets paginated list of registered chain IDs

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pageIndex | uint256 | Zero-based page index |
| _pageLength | uint256 | Number of items per page |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _thisChainId | uint256 | Chain ID of this blockchain (EIP-155) |
| _registeredChainIds | uint256[] | Paginated array of registered chain IDs |

