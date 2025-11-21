## BasicWhitelist

Abstract contract implementing basic whitelist functionality with role-based access control.

_This contract provides the external interface for whitelist management.
It inherits from BasicWhitelistInternal for storage and helper functions.
Access control is enforced using ISBE's role-based system.
This is designed to be used in diamond proxy patterns via BasicWhitelistFacet._

### constructor

```solidity
constructor() internal
```

Constructor that disables initializers for the logic contract

_This prevents the logic contract from being initialized directly_

### initializeBasicWhitelist

```solidity
function initializeBasicWhitelist(bool _enabled) external
```

Initializes the whitelist with an initial enabled/disabled state

_Can only be called once. Uses the initializer modifier to prevent re-initialization_

#### Parameters

| Name      | Type | Description                                                       |
| --------- | ---- | ----------------------------------------------------------------- |
| \_enabled | bool | Initial state of the whitelist (true to enable, false to disable) |

### addToWhitelist

```solidity
function addToWhitelist(address _account) external
```

Adds an address to the whitelist

_Requires WHITELIST_MANAGER_ROLE. Reverts if address is already whitelisted._

#### Parameters

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| \_account | address | The address to add to the whitelist |

### removeFromWhitelist

```solidity
function removeFromWhitelist(address _account) external
```

Removes an address from the whitelist

_Requires WHITELIST_MANAGER_ROLE. Reverts if address is not whitelisted._

#### Parameters

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| \_account | address | The address to remove from the whitelist |

### enableWhitelist

```solidity
function enableWhitelist() external
```

Enables the whitelist enforcement

_Requires WHITELIST_MANAGER_ROLE_

### disableWhitelist

```solidity
function disableWhitelist() external
```

Disables the whitelist enforcement

_Requires WHITELIST_MANAGER_ROLE_

### isWhitelisted

```solidity
function isWhitelisted(address _account) external view returns (bool isWhitelisted_)
```

Checks if an address is whitelisted

_Returns true if whitelist is disabled OR address is whitelisted_

#### Parameters

| Name      | Type    | Description          |
| --------- | ------- | -------------------- |
| \_account | address | The address to check |

#### Return Values

| Name            | Type | Description                                                 |
| --------------- | ---- | ----------------------------------------------------------- |
| isWhitelisted\_ | bool | True if the address is whitelisted or whitelist is disabled |

### isWhitelistEnabled

```solidity
function isWhitelistEnabled() external view returns (bool enabled_)
```

Checks if the whitelist is currently enabled

#### Return Values

| Name      | Type | Description                                   |
| --------- | ---- | --------------------------------------------- |
| enabled\_ | bool | True if whitelist is enabled, false otherwise |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this contract

_Used for ERC165 introspection_

#### Return Values

| Name         | Type     | Description            |
| ------------ | -------- | ---------------------- |
| interfaces\_ | bytes4[] | Array of interface IDs |

---

## BasicWhitelistFacet

Facet contract for BasicWhitelist functionality in ISBE diamond architecture

_This contract acts as the entry point for the BasicWhitelist functionality in a diamond proxy.
It implements IEIP2535Introspection for diamond-specific introspection capabilities.
Exposes all BasicWhitelist methods and provides selector/interface discovery._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this facet

_Used for ERC165 introspection in diamond pattern_

#### Return Values

| Name         | Type     | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| interfaces\_ | bytes4[] | Array of interface IDs implemented by this facet |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business ID (resolver key) for this facet

_Used by ISBE's BusinessLogicFactory to identify this facet_

#### Return Values

| Name         | Type    | Description                         |
| ------------ | ------- | ----------------------------------- |
| businessId\_ | bytes32 | The resolver key for BasicWhitelist |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the list of function selectors implemented by this facet

_Used by diamond to route function calls to the correct facet.
Must include ALL external functions from BasicWhitelist._

#### Return Values

| Name        | Type     | Description                        |
| ----------- | -------- | ---------------------------------- |
| selectors\_ | bytes4[] | Array of 4-byte function selectors |

---

## BasicWhitelistInternal

Internal abstract contract providing storage and helper functions for whitelist management.

_This contract defines the storage structure and internal functions for managing a basic whitelist.
It uses unstructured storage to avoid storage collisions in diamond proxy patterns.
Inherits from DidDocumentDetailedInternal to access common ISBE functionality._

### BasicWhitelistStorage

Storage structure for BasicWhitelist data

_Uses unstructured storage pattern for diamond compatibility_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct BasicWhitelistStorage {
    mapping(address => bool) whitelisted;
    bool enabled;
}
```

### \_initialize

```solidity
function _initialize(bool _enabled) internal
```

Initializes the whitelist with an enabled/disabled state

_Internal function to be called during contract initialization_

#### Parameters

| Name      | Type | Description                                                       |
| --------- | ---- | ----------------------------------------------------------------- |
| \_enabled | bool | Initial state of the whitelist (true to enable, false to disable) |

### \_enableWhitelist

```solidity
function _enableWhitelist() internal
```

Enables the whitelist enforcement

_Internal function callable by authorized contracts_

### \_disableWhitelist

```solidity
function _disableWhitelist() internal
```

Disables the whitelist enforcement

_Internal function callable by authorized contracts_

### \_addToWhitelist

```solidity
function _addToWhitelist(address _account) internal
```

Adds an address to the whitelist

_Internal function that reverts if address is already whitelisted_

#### Parameters

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| \_account | address | The address to add to the whitelist |

### \_removeFromWhitelist

```solidity
function _removeFromWhitelist(address _account) internal
```

Removes an address from the whitelist

_Internal function that reverts if address is not whitelisted_

#### Parameters

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| \_account | address | The address to remove from the whitelist |

### \_isWhitelisted

```solidity
function _isWhitelisted(address _account) internal view returns (bool isWhitelisted_)
```

Checks if an address is whitelisted

_Internal view function that returns true if whitelist is disabled OR address is whitelisted_

#### Parameters

| Name      | Type    | Description          |
| --------- | ------- | -------------------- |
| \_account | address | The address to check |

#### Return Values

| Name            | Type | Description                                             |
| --------------- | ---- | ------------------------------------------------------- |
| isWhitelisted\_ | bool | True if address is whitelisted or whitelist is disabled |

### \_isWhitelistEnabled

```solidity
function _isWhitelistEnabled() internal view returns (bool enabled_)
```

Checks if the whitelist is currently enabled

_Internal view function_

#### Return Values

| Name      | Type | Description                                   |
| --------- | ---- | --------------------------------------------- |
| enabled\_ | bool | True if whitelist is enabled, false otherwise |

---

## IBasicWhitelist

Interface for basic whitelist functionality

_Defines the external functions and events for managing a whitelist of addresses.
This interface is designed to be used in diamond proxy patterns._

### WhitelistInitialized

```solidity
event WhitelistInitialized(bool enabled)
```

Emitted when the whitelist is initialized

#### Parameters

| Name    | Type | Description                    |
| ------- | ---- | ------------------------------ |
| enabled | bool | Initial state of the whitelist |

### WhitelistStatusChanged

```solidity
event WhitelistStatusChanged(bool enabled)
```

Emitted when the whitelist status is changed

#### Parameters

| Name    | Type | Description                |
| ------- | ---- | -------------------------- |
| enabled | bool | New state of the whitelist |

### AddedToWhitelist

```solidity
event AddedToWhitelist(address account)
```

Emitted when an address is added to the whitelist

#### Parameters

| Name    | Type    | Description                |
| ------- | ------- | -------------------------- |
| account | address | The address that was added |

### RemovedFromWhitelist

```solidity
event RemovedFromWhitelist(address account)
```

Emitted when an address is removed from the whitelist

#### Parameters

| Name    | Type    | Description                  |
| ------- | ------- | ---------------------------- |
| account | address | The address that was removed |

### AddressAlreadyWhitelisted

```solidity
error AddressAlreadyWhitelisted(address account)
```

Error thrown when attempting to add an address that is already whitelisted

#### Parameters

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| account | address | The address that is already whitelisted |

### AddressNotWhitelisted

```solidity
error AddressNotWhitelisted(address account)
```

Error thrown when attempting to remove an address that is not whitelisted

#### Parameters

| Name    | Type    | Description                              |
| ------- | ------- | ---------------------------------------- |
| account | address | The address that is not in the whitelist |

### RecipientNotWhitelisted

```solidity
error RecipientNotWhitelisted(address account)
```

Error thrown when a transfer is attempted to a non-whitelisted address

#### Parameters

| Name    | Type    | Description                         |
| ------- | ------- | ----------------------------------- |
| account | address | The address that is not whitelisted |

### initializeBasicWhitelist

```solidity
function initializeBasicWhitelist(bool _enabled) external
```

Initializes the whitelist with an initial enabled/disabled state

_Can only be called once during contract initialization_

#### Parameters

| Name      | Type | Description                                                       |
| --------- | ---- | ----------------------------------------------------------------- |
| \_enabled | bool | Initial state of the whitelist (true to enable, false to disable) |

### addToWhitelist

```solidity
function addToWhitelist(address _account) external
```

Adds an address to the whitelist

_Requires WHITELIST_MANAGER_ROLE_

#### Parameters

| Name      | Type    | Description                         |
| --------- | ------- | ----------------------------------- |
| \_account | address | The address to add to the whitelist |

### removeFromWhitelist

```solidity
function removeFromWhitelist(address _account) external
```

Removes an address from the whitelist

_Requires WHITELIST_MANAGER_ROLE_

#### Parameters

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| \_account | address | The address to remove from the whitelist |

### enableWhitelist

```solidity
function enableWhitelist() external
```

Enables the whitelist enforcement

_Requires WHITELIST_MANAGER_ROLE_

### disableWhitelist

```solidity
function disableWhitelist() external
```

Disables the whitelist enforcement

_Requires WHITELIST_MANAGER_ROLE_

### isWhitelisted

```solidity
function isWhitelisted(address _account) external view returns (bool isWhitelisted_)
```

Checks if an address is whitelisted

_Returns true if whitelist is disabled OR address is whitelisted_

#### Parameters

| Name      | Type    | Description          |
| --------- | ------- | -------------------- |
| \_account | address | The address to check |

#### Return Values

| Name            | Type | Description                                                 |
| --------------- | ---- | ----------------------------------------------------------- |
| isWhitelisted\_ | bool | True if the address is whitelisted or whitelist is disabled |

### isWhitelistEnabled

```solidity
function isWhitelistEnabled() external view returns (bool enabled_)
```

Checks if the whitelist is currently enabled

#### Return Values

| Name      | Type | Description                                   |
| --------- | ---- | --------------------------------------------- |
| enabled\_ | bool | True if whitelist is enabled, false otherwise |
