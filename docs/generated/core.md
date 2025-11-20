## Common

A foundational abstract contract that bundles common functionalities and utility modifiers.

_This contract serves as a base layer for other contracts, inheriting from `Initializable`,
`ERC165Internal`, `AccessControlInternal`, `PauseInternalCommon`, and `OwnableInternal`.
It aggregates essential features like access control, pausable behaviour, and ownership,
and provides convenient modifiers for common validation checks to reduce boilerplate code._

### addressIsNotZero

```solidity
modifier addressIsNotZero(address _addr)
```

_Checks if an address equals to zero address_

#### Parameters

| Name   | Type    | Description          |
| ------ | ------- | -------------------- |
| \_addr | address | The address to check |

### bytes32IsNotZero

```solidity
modifier bytes32IsNotZero(bytes32 _hash)
```

### emptyBytes

```solidity
modifier emptyBytes(bytes _code)
```

### emptyString

```solidity
modifier emptyString(string _string)
```

### emptyUint

```solidity
modifier emptyUint(uint256 _uint)
```

---

## ERC165

Implements the ERC-165 standard for interface detection.

_This abstract contract provides a standardised way to check if a smart contract
implements a given interface. It combines the `IERC165` interface with the internal
logic from `ERC165Internal` to deliver a complete implementation. The `supportsInterface`
function is the primary entry point, allowing external contracts and applications to
query the supported interfaces of a contract._

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) external pure returns (bool)
```

---

## ERC165Internal

Provides the core internal functions for the ERC-165 interface detection standard.

_This abstract contract supplies the foundational logic for ERC-165. It offers internal
helper functions to validate interface IDs, check for support of a specific interface
within an array, and aggregate multiple interface lists. Contracts inheriting from this must
implement the `_implementedInterfaces` function to declare which interfaces they support,
enabling standardised interface detection._

### \_isERC165ForbiddenInterfaces

```solidity
function _isERC165ForbiddenInterfaces(bytes4 _interfaceId) internal pure virtual returns (bool)
```

### \_supportsERC165Interface

```solidity
function _supportsERC165Interface(bytes4 _interfaceId) internal pure virtual returns (bool)
```

### \_supportsInterface

```solidity
function _supportsInterface(bytes4 _interfaceId, bytes4[] _interfaces) internal pure virtual returns (bool supported_)
```

### \_aggregateInterfaces

```solidity
function _aggregateInterfaces(bytes4[][] _interfacesArrays, bytes4[] _interfaces) internal pure returns (bytes4[] interfaces_)
```

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## Initializable

Provides a versioned mechanism to ensure initialisation functions are executed properly per facet.

\_This abstract contract manages the initialisation state of contracts with version control,
particularly for facets within a diamond proxy pattern. It employs a unique key (`_facetKey`)
combined with version tracking to manage initialisation state across contract upgrades.

Key features:

- Version-based initialisation tracking
- Support for contract reinitialisation during upgrades
- Version-gated function access control
- Prevention of re-entrancy and unauthorised re-initialisation

The contract provides three main modifiers:

- `initializer`: For initial deployment (can only be called once per version)
- `reinitializer`: For contract upgrades (allows migration to new versions)
- `onlyFromVersion`: For version-dependent access control\_

### InitializableStorage

_Storage structure for tracking initialisation versions per facet._

```solidity
struct InitializableStorage {
    mapping(bytes32 => uint256) initialized;
}
```

### Initialized

```solidity
event Initialized(bytes32 facetKey, uint256 version)
```

_Emitted when a facet is initialised for the first time._

#### Parameters

| Name     | Type    | Description                         |
| -------- | ------- | ----------------------------------- |
| facetKey | bytes32 | The unique identifier for the facet |
| version  | uint256 | The version that was initialised    |

### Reinitialized

```solidity
event Reinitialized(bytes32 facetKey, uint256 previousVersion, uint256 newVersion)
```

_Emitted when a facet is reinitialised to a new version._

#### Parameters

| Name            | Type    | Description                            |
| --------------- | ------- | -------------------------------------- |
| facetKey        | bytes32 | The unique identifier for the facet    |
| previousVersion | uint256 | The version before reinitialisation    |
| newVersion      | uint256 | The new version after reinitialisation |

### ContractIsAlreadyInitialized

```solidity
error ContractIsAlreadyInitialized(bytes32 facetKey, uint256 currentVersion, uint256 attemptedVersion)
```

_Error thrown when attempting to initialise an already initialised facet._

#### Parameters

| Name             | Type    | Description                              |
| ---------------- | ------- | ---------------------------------------- |
| facetKey         | bytes32 | The facet that is already initialised    |
| currentVersion   | uint256 | The current version of the facet         |
| attemptedVersion | uint256 | The version that was attempted to be set |

### InvalidReinitializerVersion

```solidity
error InvalidReinitializerVersion(bytes32 facetKey, uint256 currentVersion, uint256 attemptedVersion)
```

_Error thrown when attempting to reinitialise with an invalid version._

#### Parameters

| Name             | Type    | Description                      |
| ---------------- | ------- | -------------------------------- |
| facetKey         | bytes32 | The facet being reinitialised    |
| currentVersion   | uint256 | The current version of the facet |
| attemptedVersion | uint256 | The version that was attempted   |

### InsufficientVersion

```solidity
error InsufficientVersion(bytes32 facetKey, uint256 currentVersion, uint256 requiredVersion)
```

_Error thrown when attempting to call a function before required version._

#### Parameters

| Name            | Type    | Description                      |
| --------------- | ------- | -------------------------------- |
| facetKey        | bytes32 | The facet being accessed         |
| currentVersion  | uint256 | The current version of the facet |
| requiredVersion | uint256 | The minimum version required     |

### InvalidVersionZero

```solidity
error InvalidVersionZero()
```

_Error thrown when attempting to use version 0 (reserved for uninitialised state)._

### initializer

```solidity
modifier initializer(bytes32 _facetKey, uint256 _version)
```

\_Modifier to protect an initialisation function so that it can only be invoked once
on a fresh, never-before-initialised contract.

**CRITICAL:** This modifier can ONLY be used when the stored version is 0 (never initialised).
After the first successful call, the stored version will be set to `_version`, and this
modifier will always revert on subsequent calls.

Use this for:

- Initial contract deployment
- Fresh proxy initialization

DO NOT use this for:

- Contract upgrades (use `reinitializer` instead)
- Subsequent initializations after deployment

Emits an {Initialized} event upon successful initialisation.

Example:

````solidity
// Initial deployment: stored version = 0
function initialize(bytes32 data)
    external
    initializer(FACET_KEY, 1) // ✅ Works: 0 → 1
{
    // Initialize state
}

// Second call will always fail
function initialize(bytes32 data)
    external
    initializer(FACET_KEY, 2) // ❌ Fails: version is now 1, not 0
{
    // This will revert with ContractIsAlreadyInitialized
}
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _facetKey | bytes32 | The unique identifier for the facet being initialised |
| _version | uint256 | The version being initialised (must be > 0) Requirements: - The stored version MUST be exactly 0 (never initialised before) - Version parameter must be greater than 0 - After execution, stored version will be set to `_version` |

### reinitializer

```solidity
modifier reinitializer(bytes32 _facetKey, uint256 _version)
````

_Modifier to allow reinitialisation of a contract during upgrades.
This enables contracts to be upgraded with new state variables or logic._

#### Parameters

| Name       | Type    | Description                                                                                                                                                                                                                     |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_facetKey | bytes32 | The unique identifier for the facet being reinitialised                                                                                                                                                                         |
| \_version  | uint256 | The new version being set (must be > current version) Requirements: - The new version must be greater than the current version - Version must be greater than 0 Emits a {Reinitialized} event upon successful reinitialisation. |

### onlyAfterVersion

```solidity
modifier onlyAfterVersion(bytes32 _facetKey, uint256 _minVersion)
```

_Modifier to restrict function access to contracts initialised to at least
the specified version. This enables version-dependent feature gating._

#### Parameters

| Name         | Type    | Description                                                                                                               |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| \_facetKey   | bytes32 | The unique identifier for the facet                                                                                       |
| \_minVersion | uint256 | The minimum version required to call this function Requirements: - The facet must be initialised to at least \_minVersion |

### onlyBeforeVersion

```solidity
modifier onlyBeforeVersion(bytes32 _facetKey, uint256 _minVersion)
```

Restricts function access to contracts initialised to at most the specified version.

_Used to deprecate features or restrict access in newer versions._

#### Parameters

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| \_facetKey   | bytes32 | The unique identifier for the facet.     |
| \_minVersion | uint256 | The maximum allowed version (inclusive). |

### \_disableInitializers

```solidity
function _disableInitializers(bytes32 _facetKey) internal
```

_Locks the contract, preventing any future initialisation or reinitialisation.
This should be called in the constructor of implementation contracts to prevent
them from being initialised directly (they should only be used through proxies)._

#### Parameters

| Name       | Type    | Description                                                                                                                                                                                                          |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_facetKey | bytes32 | The unique identifier for the facet to lock Note: This sets the version to type(uint256).max, effectively disabling all initialisation and reinitialisation attempts. Emits an {Initialized} event with max version. |

### \_getInitializedVersion

```solidity
function _getInitializedVersion(bytes32 _facetKey) internal view returns (uint256)
```

_Returns the current initialised version for a facet._

#### Parameters

| Name       | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| \_facetKey | bytes32 | The unique identifier for the facet |

#### Return Values

| Name | Type    | Description                                  |
| ---- | ------- | -------------------------------------------- |
| [0]  | uint256 | The current version (0 if never initialised) |

---

## LibCommon

### getFromSet

```solidity
function getFromSet(struct EnumerableSet.Bytes32Set _set, uint256 _pageIndex, uint256 _pageLength) internal view returns (bytes32[] items_)
```

### getFromSet

```solidity
function getFromSet(struct EnumerableSet.AddressSet _set, uint256 _pageIndex, uint256 _pageLength) internal view returns (address[] items_)
```

### getFromSet

```solidity
function getFromSet(struct EnumerableSet.UintSet _set, uint256 _pageIndex, uint256 _pageLength) internal view returns (uint256[] items_)
```

### getSize

```solidity
function getSize(uint256 _start, uint256 _end, uint256 _listCount) internal pure returns (uint256)
```

### getStartAndEnd

```solidity
function getStartAndEnd(uint256 _pageIndex, uint256 _pageLength) internal pure returns (uint256 start_, uint256 end_)
```

### getPaginationParameters

```solidity
function getPaginationParameters(uint256 _total, uint256 _page, uint256 _pageSize) internal pure returns (uint256 cursor_, uint256 howMany_, uint256 prev_, uint256 next_)
```
