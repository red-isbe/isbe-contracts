## ERC20Capped

Implements capped mechanism

_Inherits from IERC20Capped and ERC203643InternalCommon_

### constructor

```solidity
constructor() internal
```

### initializeCap

```solidity
function initializeCap(uint256 _newCap) external
```

### mint

```solidity
function mint(address _account, uint256 _amount) external
```

### setCap

```solidity
function setCap(uint256 _newCap) external
```

### cap

```solidity
function cap() external view returns (uint256)
```

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC20CappedFacet

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name         | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| interfaces\_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| businessId\_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name        | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| selectors\_ | bytes4[] | An array of `bytes4` function selectors. |

---

## ERC20CappedInternal

Internal implementation of an ERC20 token with a capped total supply.
This contract defines the internal logic for setting and retrieving the supply cap,
while ensuring proper validation of the cap value.

_This contract: - Uses a `struct` to manage the cap value within storage. - Provides the `_setCap` function for initializing the cap, which ensures the value is greater than zero. - Includes `_cap` for accessing the stored cap value. - Utilizes a private `_erc20CappedStorage` function that leverages a specific storage slot for cap management.
This contract is intended to be inherited by other contracts, which will provide external interface functions._

### ERC20CappedStorage

```solidity
struct ERC20CappedStorage {
    uint256 cap;
}
```

### checkNewCap

```solidity
modifier checkNewCap(uint256 _newCap)
```

### checkCap

```solidity
modifier checkCap(uint256 _amount)
```

### \_mint

```solidity
function _mint(address _account, uint256 _amount) internal virtual
```

\_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address.\_

### \_setCap

```solidity
function _setCap(uint256 _newCap) internal
```

### \_cap

```solidity
function _cap() internal view returns (uint256)
```

### \_checkNewCap

```solidity
function _checkNewCap(uint256 _newCap) internal view virtual
```

### \_checkCap

```solidity
function _checkCap(uint256 _amount) internal view virtual
```

---

## IERC20Capped

Interface for implementing a capped total supply for ERC20 tokens.
It includes functionality to initialize a supply cap, emit related events, and handle cap validation errors.

_Provides: - `initializeCap`: A function to set the maximum allowable token supply. - `CapInitialized`: An event emitted when the cap is successfully set. - `CapIsZero` and `CapExceeded`: Custom errors to enforce and validate cap-related rules.
This interface must be implemented by any ERC20 token contract with a supply cap mechanism._

### CapSet

```solidity
event CapSet(address operator, uint256 newCap)
```

Emitted after successfully initializing the token cap.

_Should be triggered when `initializeCap` or 'SetCap' sets the supply cap._

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

_Ensures that the token supply cap must always be greater than the totalsupply._

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
Emits a `CapInitialized` event if successful._

#### Parameters

| Name  | Type    | Description                           |
| ----- | ------- | ------------------------------------- |
| \_cap | uint256 | The desired maximum token supply cap. |
