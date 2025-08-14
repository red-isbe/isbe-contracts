## ERC721Controller

Implements force mechanism for ERC721 tokens (force transfer and burn)

_Inherits from IERC721Controller and ERC721Internal_

### forceTransfer

```solidity
function forceTransfer(address from, address to, uint256 tokenId) external
```

Transfers a token from one account to another without requiring approval.

_Only callable by accounts with the controller role.
Emits a ForceTransfer event._

### forceBurn

```solidity
function forceBurn(address from, uint256 tokenId) external
```

Burns a token from an account without requiring approval.

_Only callable by accounts with the controller role.
Emits a ForceBurn event._

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC721ControllerFacet

Facet exposing controller functions for ERC721 tokens in diamond/facet architectures.

_Implements forceTransfer and forceBurn for administrative control._

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

## IERC721Controller

Interface for administrative control over ERC-721 tokens, allowing forced transfers and burns

_Intended for use in regulated environments or asset-backed NFTs where such functionality is required_

### ForceTransfer

```solidity
event ForceTransfer(address operator, address from, address to, uint256 tokenId)
```

Emitted when a token is forcefully transferred from one account to another

#### Parameters

| Name     | Type    | Description                                |
| -------- | ------- | ------------------------------------------ |
| operator | address | The address performing the forced transfer |
| from     | address | The address the token is taken from        |
| to       | address | The address the token is sent to           |
| tokenId  | uint256 | The identifier of the token transferred    |

### ForceBurn

```solidity
event ForceBurn(address operator, address from, uint256 tokenId)
```

Emitted when a token is forcefully burned from an account

#### Parameters

| Name     | Type    | Description                            |
| -------- | ------- | -------------------------------------- |
| operator | address | The address performing the forced burn |
| from     | address | The address the token is burned from   |
| tokenId  | uint256 | The identifier of the token burned     |

### forceTransfer

```solidity
function forceTransfer(address from, address to, uint256 tokenId) external
```

Transfers a token from one account to another without requiring approval

_This function should only be callable by an authorized controller (e.g., regulator or admin contract)_

#### Parameters

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| from    | address | The address to transfer the token from  |
| to      | address | The address to transfer the token to    |
| tokenId | uint256 | The identifier of the token to transfer |

### forceBurn

```solidity
function forceBurn(address from, uint256 tokenId) external
```

Burns a token from an account without requiring approval

_This function should only be callable by an authorized controller (e.g., regulator or admin contract)_

#### Parameters

| Name    | Type    | Description                         |
| ------- | ------- | ----------------------------------- |
| from    | address | The address to burn the token from  |
| tokenId | uint256 | The identifier of the token to burn |
