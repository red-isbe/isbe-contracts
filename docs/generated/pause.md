## IPause

Interface for contracts that require pausing and unpausing capability

### Paused

```solidity
event Paused(address account)
```

Emitted when the contract is paused

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| account | address | The address that triggered the pause |

### Unpaused

```solidity
event Unpaused(address account)
```

Emitted when the contract is unpaused

#### Parameters

| Name    | Type    | Description                            |
| ------- | ------- | -------------------------------------- |
| account | address | The address that triggered the unpause |

### InsufficientAuthorityLevel

```solidity
error InsufficientAuthorityLevel(uint256 authorityLevel, uint256 requiredAuthorityLevel)
```

Thrown when an account's authority level is insufficient

#### Parameters

| Name                   | Type    | Description                                                   |
| ---------------------- | ------- | ------------------------------------------------------------- |
| authorityLevel         | uint256 | The caller's current authority level                          |
| requiredAuthorityLevel | uint256 | The minimum required authority level to perform the operation |

### IsPaused

```solidity
error IsPaused()
```

Thrown when attempting to execute an action that requires the contract to be unpaused

### IsNotPaused

```solidity
error IsNotPaused()
```

Thrown when attempting to execute an action that requires the contract to be paused

### initializePause

```solidity
function initializePause(bool _paused) external
```

Initializes the paused state of the contract

_Should be called only once during the contract's initialization_

#### Parameters

| Name     | Type | Description                                         |
| -------- | ---- | --------------------------------------------------- |
| \_paused | bool | Whether the contract should start in a paused state |

### pause

```solidity
function pause() external
```

Pauses the contract

_Only callable by accounts with sufficient authority_

### unpause

```solidity
function unpause() external
```

Unpauses the contract

_Only callable by accounts with sufficient authority_

### paused

```solidity
function paused() external view returns (bool)
```

Returns whether the contract is currently paused

#### Return Values

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| [0]  | bool | True if the contract is paused, false otherwise |

### authorityLevel

```solidity
function authorityLevel() external view returns (uint256)
```

Returns the authority level of the account that paused the contract

#### Return Values

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | uint256 | The last pauser's authority level |

---

## ISBEPause

Implements pausing mechanism for ISBE project

_Inherits from Pause and implements the abstract methods according to ISBE functional requirements_

### \_checkPauserRoles

```solidity
function _checkPauserRoles() internal view
```

### \_getAuthorityLevel

```solidity
function _getAuthorityLevel(address _account) internal view returns (uint256)
```

---

## ISBEPauseFacet

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Retrieves the interfaces supported by the EIP-2535 Diamond Standard.

_Returns a static list of interfaces supported by the contract. It is a view function and does not
modify or depend on contract state._

#### Return Values

| Name         | Type     | Description                                                                         |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| interfaces\_ | bytes4[] | An array of interface identifiers (`bytes4[]`) compliant with the EIP-165 standard. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Retrieves the function selectors supported by the EIP-2535 Diamond Standard.

_Returns a static list of function selectors supported by the interface. It is a pure function and does not
modify or depend on contract state._

#### Return Values

| Name        | Type     | Description                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------------- |
| selectors\_ | bytes4[] | An array of function selectors (`bytes4[]`) compliant with the EIP-2535 standard. |

---

## Pause

Implements pausing mechanism

_Inherits from IPause and PauseInternal, providing external pause functions_

### constructor

```solidity
constructor() internal
```

Constructor that disables the initializer

### initializePause

```solidity
function initializePause(bool _paused) external
```

Initializes the paused state of the contract

_Should be called only once during the contract's initialization_

#### Parameters

| Name     | Type | Description                                         |
| -------- | ---- | --------------------------------------------------- |
| \_paused | bool | Whether the contract should start in a paused state |

### pause

```solidity
function pause() external
```

Pauses the contract

_Only callable by accounts with sufficient authority_

### unpause

```solidity
function unpause() external
```

Unpauses the contract

_Only callable by accounts with sufficient authority_

### paused

```solidity
function paused() external view returns (bool)
```

Returns whether the contract is currently paused

#### Return Values

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| [0]  | bool | True if the contract is paused, false otherwise |

### authorityLevel

```solidity
function authorityLevel() external view returns (uint256)
```

Returns the authority level of the account that paused the contract

#### Return Values

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | uint256 | The last pauser's authority level |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## PauseInternal

Internal logic for pausing mechanism

### \_pause

```solidity
function _pause() internal virtual
```

### \_unpause

```solidity
function _unpause() internal virtual
```

### \_authorityLevel

```solidity
function _authorityLevel() internal view virtual returns (uint256)
```

### \_checkAuthorityLevel

```solidity
function _checkAuthorityLevel() internal view
```

### \_getAuthorityLevel

```solidity
function _getAuthorityLevel(address _account) internal view virtual returns (uint256)
```

### \_checkPauserRoles

```solidity
function _checkPauserRoles() internal view virtual
```

### \_compareAuthorityLevels

```solidity
function _compareAuthorityLevels(uint256 _newLevel, uint256 _previousLevel) internal pure virtual returns (bool)
```

---

## PauseInternalCommon

Internal logic for pausing mechanism

### PauseStorage

Structure for storing pause state and authority level

```solidity
struct PauseStorage {
    bool pause;
    uint256 authorityLevel;
}
```

### whenNotPaused

```solidity
modifier whenNotPaused()
```

Modifier to allow function execution only when the contract is not paused

_Reverts with `IsPaused` error if the contract is currently paused_

### whenPaused

```solidity
modifier whenPaused()
```

Modifier to allow function execution only when the contract is paused

_Reverts with `IsNotPaused` error if the contract is not currently paused_

### \_paused

```solidity
function _paused() internal view virtual returns (bool)
```

### \_requireNotPaused

```solidity
function _requireNotPaused() internal view virtual
```

### \_requirePaused

```solidity
function _requirePaused() internal view virtual
```

### \_pauseStorage

```solidity
function _pauseStorage() internal pure returns (struct PauseInternalCommon.PauseStorage pauseStorage_)
```

Returns the storage slot for pause

_Uses inline assembly to return storage struct at predefined slot_

#### Return Values

| Name           | Type                                    | Description              |
| -------------- | --------------------------------------- | ------------------------ |
| pauseStorage\_ | struct PauseInternalCommon.PauseStorage | The pause storage struct |
