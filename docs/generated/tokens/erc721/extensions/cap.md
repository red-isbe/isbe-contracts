## ERC721Capped

Implements capped mechanism for ERC721 tokens.

_Inherits from IERC721Capped and ERC721CappedInternal.
This contract provides external functions to initialize and update the cap,
as well as minting with cap validation._

### constructor

```solidity
constructor() internal
```

### initializeCap

```solidity
function initializeCap(uint256 newCap) external
```

Initializes the maximum supply cap for the token.

_This function is expected to be called once to set the total supply cap.
Emits a `CapSet` event if successful._

#### Parameters

| Name   | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| newCap | uint256 | The desired maximum token supply cap. |

### mint

```solidity
function mint(address to, uint256 tokenId) external
```

Mints a new token, enforcing the cap.

_Only for demonstration; in production, add access control (e.g., onlyOwner or roles)._

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| to      | address | The address to mint the token to.    |
| tokenId | uint256 | The unique identifier for the token. |

### setCap

```solidity
function setCap(uint256 newCap) external
```

Updates the cap value.

_Only for demonstration; in production, add access control (e.g., onlyRole).
Emits a `CapSet` event if successful._

#### Parameters

| Name   | Type    | Description        |
| ------ | ------- | ------------------ |
| newCap | uint256 | The new cap value. |

### cap

```solidity
function cap() external view returns (uint256)
```

Returns the current cap value.

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC721CappedFacet

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

## ERC721CappedInternal

Internal implementation of an ERC721 token with a capped total supply.
This contract defines the internal logic for setting and retrieving the supply cap,
while ensuring proper validation of the cap value.

_This contract: - Uses a `struct` to manage the cap value within storage. - Provides the `_setCap` function for initializing the cap, which ensures the value is greater than zero. - Includes `_cap` for accessing the stored cap value. - Utilizes a private `_erc721CappedStorage` function that leverages a specific storage slot for cap management.
This contract is intended to be inherited by other contracts, which will provide external interface functions._

### ERC721CappedStorage

```solidity
struct ERC721CappedStorage {
    uint256 cap;
}
```

### checkNewCap

```solidity
modifier checkNewCap(uint256 newCap)
```

### checkCap

```solidity
modifier checkCap(uint256 amount)
```

### \_mint

```solidity
function _mint(address to, uint256 tokenId) internal virtual
```

### \_setCap

```solidity
function _setCap(uint256 newCap) internal
```

### \_cap

```solidity
function _cap() internal view returns (uint256)
```

### \_checkNewCap

```solidity
function _checkNewCap(uint256 newCap) internal view virtual
```

### \_checkCap

```solidity
function _checkCap(uint256 amount) internal view virtual
```

---

## IERC721Capped

Interface for implementing a capped total supply for ERC721 tokens.
It includes functionality to initialize a supply cap, emit related events, and handle cap validation errors.

_Provides: - `initializeCap`: A function to set the maximum allowable token supply. - `CapSet`: An event emitted when the cap is successfully set. - `CapIsZero`, `NewCapIsLessThanTotalSupply`, and `CapExceeded`: Custom errors to enforce and validate
cap-related rules.
This interface must be implemented by any ERC721 token contract with a supply cap mechanism._

### CapSet

```solidity
event CapSet(address operator, uint256 newCap)
```

Emitted after successfully initializing the token cap.

_Should be triggered when `initializeCap` or 'setCap' sets the supply cap._

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

_Ensures that the token supply cap must always be greater than or equal to the totalSupply._

### CapExceeded

```solidity
error CapExceeded()
```

Thrown when the maximum token supply cap is exceeded.

_Triggered during operations like minting that would breach the defined cap._

### initializeCap

```solidity
function initializeCap(uint256 cap) external
```

Initializes the maximum supply cap for the token.

_This function is expected to be called once to set the total supply cap.
Emits a `CapSet` event if successful._

#### Parameters

| Name | Type    | Description                           |
| ---- | ------- | ------------------------------------- |
| cap  | uint256 | The desired maximum token supply cap. |
