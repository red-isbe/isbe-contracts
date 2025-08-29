## ERC721Consecutive

Implements consecutive minting for ERC721 tokens (EIP-2309)

_Inherits from IERC721Consecutive and ERC721ConsecutiveInternal_

### constructor

```solidity
constructor() internal
```

### mintConsecutive

```solidity
function mintConsecutive(address to, uint256 quantity) external
```

Mints a consecutive range of tokens to `to`

_Only callable by accounts with the minter role_

#### Parameters

| Name     | Type    | Description                              |
| -------- | ------- | ---------------------------------------- |
| to       | address | The address to receive the minted tokens |
| quantity | uint256 | The number of tokens to mint             |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC721ConsecutiveFacet

Facet for ERC721 consecutive minting (EIP-2309) in diamond/facet architectures

_Exposes external interface for consecutive minting and introspection_

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

## ERC721ConsecutiveInternal

_Internal logic for ERC721 Consecutive extension (EIP-2309)_

### ERC721ConsecutiveStorage

```solidity
struct ERC721ConsecutiveStorage {
    uint256 _currentConsecutiveTokenId;
}
```

### \_mintConsecutive

```solidity
function _mintConsecutive(address to, uint256 quantity) internal
```

_Internal mint function for consecutive tokens_

---

## IERC721Consecutive

_See https://eips.ethereum.org/EIPS/eip-2309_

### ConsecutiveTransfer

```solidity
event ConsecutiveTransfer(uint256 fromTokenId, uint256 toTokenId, address fromAddress, address toAddress)
```

_This event MUST be emitted when tokens are minted in a consecutive range.
See EIP-2309 for details._

### mintConsecutive

```solidity
function mintConsecutive(address to, uint256 quantity) external
```

Mints a consecutive range of tokens to `to`.

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| to       | address | The address to receive the minted tokens. |
| quantity | uint256 | The number of tokens to mint.             |
