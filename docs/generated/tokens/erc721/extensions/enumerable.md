## ERC721Enumerable

Implements enumerable extension for ERC721 tokens.

_Inherits from IERC721Enumerable and ERC721InternalCommon._

### totalSupplyEnumerable

```solidity
function totalSupplyEnumerable() external view returns (uint256)
```

Returns the total amount of tokens stored by the contract.

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)
```

Returns a token ID owned by `owner` at a given `index` of its token list.

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) external view returns (uint256)
```

Returns a token ID at a given `index` of all the tokens stored by the contract.

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC721EnumerableFacet

Facet for ERC721 enumerable extension in diamond/facet architectures.

_Exposes external interface for token enumeration and querying. - Should be registered in the diamond with all required selectors._

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

## ERC721EnumerableInternal

Internal logic for ERC721 enumerable extension.

_Tracks all token IDs and per-owner token lists for enumeration.
Should be inherited by the main internal logic contract._

### EnumerableStorage

```solidity
struct EnumerableStorage {
    uint256[] allTokens;
    mapping(uint256 => uint256) allTokensIndex;
    mapping(address => uint256[]) ownedTokens;
    mapping(uint256 => uint256) ownedTokensIndex;
}
```

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_Hook that is called before any token transfer. Updates enumeration data structures._

### \_totalSupplyEnumerable

```solidity
function _totalSupplyEnumerable() internal view virtual returns (uint256)
```

_Returns the total amount of tokens stored by the contract._

### \_tokenOfOwnerByIndex

```solidity
function _tokenOfOwnerByIndex(address owner, uint256 index) internal view virtual returns (uint256)
```

_Returns a token ID owned by `owner` at a given `index` of its token list._

### \_tokenByIndex

```solidity
function _tokenByIndex(uint256 index) internal view virtual returns (uint256)
```

_Returns a token ID at a given `index` of all the tokens stored by the contract._

---

## IERC721Enumerable

Interface for ERC721 contracts with enumerable extension.
Enables enumeration of all tokens and tokens owned by a specific account.

_Provides mechanisms to: - Retrieve the total supply of tokens. - Enumerate tokens by global index. - Enumerate tokens owned by an account by index.
This interface should be implemented by ERC721 contracts that require token enumeration._

### OwnerIndexOutOfBounds

```solidity
error OwnerIndexOutOfBounds()
```

Error thrown when the owner index is out of bounds.

### GlobalIndexOutOfBounds

```solidity
error GlobalIndexOutOfBounds()
```

Error thrown when the global index is out of bounds.

### totalSupplyEnumerable

```solidity
function totalSupplyEnumerable() external view returns (uint256)
```

Returns the total amount of tokens stored by the contract.

_Useful for external interfaces and off-chain applications._

#### Return Values

| Name | Type    | Description                 |
| ---- | ------- | --------------------------- |
| [0]  | uint256 | The total number of tokens. |

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)
```

Returns a token ID owned by `owner` at a given `index` of its token list.

_Use along with {balanceOf} to enumerate all of `owner`'s tokens.
Reverts if `index` is greater than or equal to {balanceOf(owner)}._

#### Parameters

| Name  | Type    | Description                          |
| ----- | ------- | ------------------------------------ |
| owner | address | The address to query.                |
| index | uint256 | The index in the owner's token list. |

#### Return Values

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The token ID at the given index for the owner. |

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) external view returns (uint256)
```

Returns a token ID at a given `index` of all the tokens stored by the contract.

_Use along with {totalSupply} to enumerate all tokens.
Reverts if `index` is greater than or equal to {totalSupply()}._

#### Parameters

| Name  | Type    | Description                         |
| ----- | ------- | ----------------------------------- |
| index | uint256 | The index in the global token list. |

#### Return Values

| Name | Type    | Description                                    |
| ---- | ------- | ---------------------------------------------- |
| [0]  | uint256 | The token ID at the given index of all tokens. |
