## IOwnable

External interface for owner access control functionality

### OwnershipTransferred

```solidity
event OwnershipTransferred(address operator, address newOwner)
```

Emitted when the owner is changed

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| operator | address | The account transfering the owner |
| newOwner | address | The new owner                     |

### OwnershipRenounced

```solidity
event OwnershipRenounced(address operator)
```

Emitted when ownership is renounced

#### Parameters

| Name     | Type    | Description                          |
| -------- | ------- | ------------------------------------ |
| operator | address | The account that renounced ownership |

### AccountIsNotOwner

```solidity
error AccountIsNotOwner(address account)
```

Reverts when a non-owner account attempts an owner-only operation

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| account | address | The account that triggered the error |

### renounceOwnership

```solidity
function renounceOwnership() external
```

Renounces ownership of the contract

_Leaves the contract without an owner. Functions restricted to the owner will be disabled._

### transferOwnership

```solidity
function transferOwnership(address newOwner) external
```

Transfers ownership of the contract to a new account

#### Parameters

| Name     | Type    | Description                  |
| -------- | ------- | ---------------------------- |
| newOwner | address | The address of the new owner |

### owner

```solidity
function owner() external view returns (address)
```

Returns the current owner of the contract

#### Return Values

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | address | The address of the current owner |

---

## IOwnable2Step

Interface for contracts using a two-step ownership transfer pattern

### OwnershipTransferStarted

```solidity
event OwnershipTransferStarted(address operator, address newPendingOwner)
```

Emitted when ownership transfer is initiated

#### Parameters

| Name            | Type    | Description                                  |
| --------------- | ------- | -------------------------------------------- |
| operator        | address | The current owner initiating the transfer    |
| newPendingOwner | address | The address proposed to become the new owner |

### OwnershipAccepted

```solidity
event OwnershipAccepted(address operator)
```

Emitted when the pending owner accepts and becomes the new owner

#### Parameters

| Name     | Type    | Description                         |
| -------- | ------- | ----------------------------------- |
| operator | address | The account that accepted ownership |

### AccountIsNotPendingOwner

```solidity
error AccountIsNotPendingOwner(address account)
```

Reverts when an account that is not the pending owner tries to accept ownership

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| account | address | The account that triggered the error |

### acceptOwnership

```solidity
function acceptOwnership() external
```

Accepts ownership of the contract

_Callable only by the pending owner. Completes the two-step ownership transfer process._

### pendingOwner

```solidity
function pendingOwner() external view returns (address)
```

Returns the address of the pending owner

#### Return Values

| Name | Type    | Description                                                |
| ---- | ------- | ---------------------------------------------------------- |
| [0]  | address | The address that has been proposed to become the new owner |

---

## Ownable

Implements ownership mechanisms

_Inherits from IOwnable and OwnableInternal_

### transferOwnership

```solidity
function transferOwnership(address newOwner) external
```

Transfers ownership of the contract to a new account

#### Parameters

| Name     | Type    | Description                  |
| -------- | ------- | ---------------------------- |
| newOwner | address | The address of the new owner |

---

## Ownable2Step

Implements ownership 2 step mechanisms

_Inherits from IOwnable2Step, Ownable and Ownable2StepInternal_

### transferOwnership

```solidity
function transferOwnership(address newOwner) external
```

Transfers ownership of the contract to a new account

#### Parameters

| Name     | Type    | Description                  |
| -------- | ------- | ---------------------------- |
| newOwner | address | The address of the new owner |

### acceptOwnership

```solidity
function acceptOwnership() external
```

Accepts ownership of the contract

_Callable only by the pending owner. Completes the two-step ownership transfer process._

### pendingOwner

```solidity
function pendingOwner() external view returns (address)
```

Returns the address of the pending owner

#### Return Values

| Name | Type    | Description                                                |
| ---- | ------- | ---------------------------------------------------------- |
| [0]  | address | The address that has been proposed to become the new owner |

---

## Ownable2StepFacet

Implements ownership mechanisms

_Inherits from IOwnable and OwnableInternal_

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

## Ownable2StepInternal

Internal logic for 2 step owner control

### Ownable2StepStorage

Struct storing the pending owner

```solidity
struct Ownable2StepStorage {
    address pendingOwner;
}
```

### onlyPendingOwner

```solidity
modifier onlyPendingOwner()
```

Modifier to restrict function execution to the pending owner account

_Reverts with `AccountIsNotPendingOwner` error if the account is not the pending owner_

### \_initiateTransferOwnership

```solidity
function _initiateTransferOwnership(address newOwner) internal virtual
```

### \_acceptOwnership

```solidity
function _acceptOwnership() internal virtual
```

### \_pendingOwner

```solidity
function _pendingOwner() internal view virtual returns (address)
```

### \_checkPendingOwner

```solidity
function _checkPendingOwner() internal view virtual
```

### \_ownable2StepStorage

```solidity
function _ownable2StepStorage() internal pure returns (struct Ownable2StepInternal.Ownable2StepStorage storage_)
```

---

## OwnableBase

Implements ownership mechanisms

_Inherits from IOwnable and OwnableInternal_

### constructor

```solidity
constructor() internal
```

Constructor that disables the initializer

### initializeOwnable

```solidity
function initializeOwnable(address admin) external
```

### renounceOwnership

```solidity
function renounceOwnership() external
```

Renounces ownership of the contract

_Leaves the contract without an owner. Functions restricted to the owner will be disabled._

### owner

```solidity
function owner() external view returns (address)
```

Returns the current owner of the contract

#### Return Values

| Name | Type    | Description                      |
| ---- | ------- | -------------------------------- |
| [0]  | address | The address of the current owner |

---

## OwnableFacet

Implements ownership mechanisms

_Inherits from IOwnable and OwnableInternal_

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

## OwnableInternal

Internal logic for owner control

### OwnableStorage

Struct storing the owner

```solidity
struct OwnableStorage {
    address owner;
}
```

### onlyOwner

```solidity
modifier onlyOwner()
```

Modifier to restrict function execution to the owner account

_Reverts with `AccountIsNotOwner` error if the account is not the owner_

### \_transferOwnership

```solidity
function _transferOwnership(address newOwner) internal virtual
```

### \_owner

```solidity
function _owner() internal view virtual returns (address)
```

### \_checkOwner

```solidity
function _checkOwner() internal view virtual
```

### \_ownableStorage

```solidity
function _ownableStorage() internal pure returns (struct OwnableInternal.OwnableStorage storage_)
```
