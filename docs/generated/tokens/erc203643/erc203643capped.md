## ERC203643Capped

Implements unified capped mechanism with minting functionality for both ERC20 and ERC3643 tokens

_Inherits from IERC203643Capped and ERC203643InternalCommon
Behavior adapts automatically based on token type through internal logic_

### constructor

```solidity
constructor() internal
```

### initializeCap

```solidity
function initializeCap(uint256 _newCap) external
```

Initializes the maximum supply cap for the token

_Can only be called once during contract initialization.
Emits a {CapSet} event if successful._

#### Parameters

| Name     | Type    | Description                          |
| -------- | ------- | ------------------------------------ |
| \_newCap | uint256 | The desired maximum token supply cap |

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

Mint tokens to an address

\_Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
ERC3643-specific logic (identity verification) is handled automatically in
ERC203643InternalCommon.\_beforeTokenTransfer.

     Respects the cap limit set for the token.

     Emits a {Transfer} event from address(0) via {_mint}._

#### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| \_to     | address | The address to mint tokens to |
| \_amount | uint256 | The number of tokens to mint  |

### setCap

```solidity
function setCap(uint256 _newCap) external
```

Update the supply cap

_Administrative function to modify the maximum token supply.
Emits a {CapSet} event if successful._

#### Parameters

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| \_newCap | uint256 | The new maximum supply cap |

### cap

```solidity
function cap() external view returns (uint256)
```

Get the current supply cap

#### Return Values

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| [0]  | uint256 | The maximum number of tokens that can exist |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Declares the interfaces implemented by this contract._

#### Return Values

| Name         | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface identifiers. |

---

## ERC203643CappedFacet

Diamond facet for unified ERC20/ERC3643 capped token functionality

_Provides supply cap management and minting capabilities for both token standards_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

_Returns the interfaces implemented by this facet_

#### Return Values

| Name         | Type     | Description                    |
| ------------ | -------- | ------------------------------ |
| interfaces\_ | bytes4[] | Array of interface identifiers |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

_Returns the business identifier for this facet_

#### Return Values

| Name         | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| businessId\_ | bytes32 | The resolver key for this facet |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

_Returns the function selectors exposed by this facet_

#### Return Values

| Name        | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| selectors\_ | bytes4[] | Array of function selectors |

---

## ERC203643CappedInternal

Internal implementation of unified capped mechanism for both ERC20 and ERC3643 tokens.
This contract defines the internal logic for setting and retrieving the supply cap,
while ensuring proper validation of the cap value.

_This contract: - Uses a `struct` to manage the cap value within storage. - Provides the `_setCap` function for initializing the cap, which ensures the value is greater than zero. - Includes `_cap` for accessing the stored cap value. - Utilizes a private `_erc203643CappedStorage` function that leverages a specific storage slot for cap mangment. - Behavior adapts automatically for ERC20/ERC3643 through ERC203643InternalCommon.\_beforeTokenTransfer.
This contract is intended to be inherited by other contracts, which will provide external interface functions._

### ERC203643CappedStorage

_Storage struct for capped functionality_

```solidity
struct ERC203643CappedStorage {
    uint256 cap;
}
```

### checkNewCap

```solidity
modifier checkNewCap(uint256 _newCap)
```

_Modifier to validate a new cap value before setting it_

#### Parameters

| Name     | Type    | Description                   |
| -------- | ------- | ----------------------------- |
| \_newCap | uint256 | The new cap value to validate |

### checkCap

```solidity
modifier checkCap(uint256 _amount)
```

_Modifier to check that minting amount doesn't exceed the cap_

#### Parameters

| Name     | Type    | Description             |
| -------- | ------- | ----------------------- |
| \_amount | uint256 | The amount to be minted |

### \_setCap

```solidity
function _setCap(uint256 _newCap) internal
```

_Internal function to set the supply cap_

#### Parameters

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| \_newCap | uint256 | The new maximum supply cap |

### \_cap

```solidity
function _cap() internal view returns (uint256)
```

_Internal function to get the current supply cap_

#### Return Values

| Name | Type    | Description                    |
| ---- | ------- | ------------------------------ |
| [0]  | uint256 | The current maximum supply cap |

### \_checkNewCap

```solidity
function _checkNewCap(uint256 _newCap) internal view virtual
```

_Internal function to validate a new cap value_

#### Parameters

| Name     | Type    | Description                                                                                                                                                                                                                                          |
| -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newCap | uint256 | The new cap value to validate Requirements: - New cap must be greater than zero - New cap must be >= current total supply Reverts: - {CapIsZero} if `_newCap` is zero - {NewCapIsLessThanTotalSupply} if `_newCap` is less than current total supply |

### \_checkCap

```solidity
function _checkCap(uint256 _amount) internal view virtual
```

_Internal function to check that an amount doesn't exceed the cap when added to current supply_

#### Parameters

| Name     | Type    | Description                                                                                                                                                      |
| -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_amount | uint256 | The amount to check against the cap Requirements: - Current supply + amount must be <= cap Reverts: - {CapExceeded} if the operation would exceed the supply cap |

---

## IERC203643Capped

Unified interface for capped tokens with minting functionality for both ERC20 and ERC3643

\_Provides supply cap management and administrative mint operations.
Behavior adapts automatically based on token type (ERC20 vs ERC3643).

     Includes functionality to initialize a supply cap, emit related events, and handle cap validation errors.
     This interface must be implemented by any token contract with a supply cap mechanism._

### CapSet

```solidity
event CapSet(address operator, uint256 newCap)
```

Emitted after successfully initializing or updating the token cap.

_Should be triggered when `initializeCap` or `setCap` sets the supply cap._

#### Parameters

| Name     | Type    | Description                        |
| -------- | ------- | ---------------------------------- |
| operator | address | The account that set the cap.      |
| newCap   | uint256 | The value of the token supply cap. |

### CapIsZero

```solidity
error CapIsZero()
```

Thrown when an invalid token cap of zero is provided.

_Ensures that the token supply cap must always be greater than zero._

### NewCapIsLessThanTotalSupply

```solidity
error NewCapIsLessThanTotalSupply(uint256 cap, uint256 totalSupply)
```

Thrown when an invalid token cap of less than the total supply is provided.

_Ensures that the token supply cap must always be greater than the total supply._

### CapExceeded

```solidity
error CapExceeded()
```

Thrown when the maximum token supply cap is exceeded.

_Triggered during operations like minting that would breach the defined cap._

### initializeCap

```solidity
function initializeCap(uint256 _cap) external
```

Initializes the maximum supply cap for the token.

_This function is expected to be called once to set the total supply cap.
Emits a `CapSet` event if successful._

#### Parameters

| Name  | Type    | Description                                                                                                                            |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| \_cap | uint256 | The desired maximum token supply cap. Requirements: - Can only be called once during initialization - `_cap` must be greater than zero |

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

Mint tokens to an address by an authorized minter

\_No approval required from token holder.
Respects the supply cap - will revert if minting would exceed the cap.

     **ERC20 Mode:** Simple minting without additional validations
     **ERC3643 Mode:** Requires recipient to be verified in Identity Registry_

#### Parameters

| Name     | Type    | Description                                                                                                                                                                                                                                                                                                                                               |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_to     | address | The address to mint tokens to (must be verified for ERC3643)                                                                                                                                                                                                                                                                                              |
| \_amount | uint256 | The number of tokens to mint Requirements: - Caller must have MINTER_ROLE - Contract must not be paused - For ERC3643: `_to` must be verified in Identity Registry - Total supply after minting must not exceed cap Emits: - {Transfer} event from address(0) via internal mint mechanism Reverts: - {CapExceeded} if minting would exceed the supply cap |

### setCap

```solidity
function setCap(uint256 _newCap) external
```

Update the supply cap

_Administrative function to modify the maximum token supply_

#### Parameters

| Name     | Type    | Description                                                                                                                                                                                                                                                                                                           |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_newCap | uint256 | The new maximum supply cap Requirements: - Caller must have CAP_ROLE - Contract must not be paused - New cap must be >= current total supply - New cap must be > 0 Emits: - {CapSet} event Reverts: - {CapIsZero} if `_newCap` is zero - {NewCapIsLessThanTotalSupply} if `_newCap` is less than current total supply |

### cap

```solidity
function cap() external view returns (uint256)
```

Get the current supply cap

#### Return Values

| Name | Type    | Description                                 |
| ---- | ------- | ------------------------------------------- |
| [0]  | uint256 | The maximum number of tokens that can exist |
