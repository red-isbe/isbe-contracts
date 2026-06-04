## ERC721Royalty

Implements EIP-2981 royalty mechanism for ERC721 tokens.

_Inherits from IERC721Royalty and ERC721RoyaltyInternal._

### setDefaultRoyalty

```solidity
function setDefaultRoyalty(address receiver, uint96 feeNumerator) external
```

Sets the default royalty information.

_Only callable by authorized roles (add access control in production)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | Address to receive royalties. |
| feeNumerator | uint96 | Royalty fraction. |

### deleteDefaultRoyalty

```solidity
function deleteDefaultRoyalty() external
```

Removes the default royalty information.

_Only callable by authorized roles (add access control in production)._

### setTokenRoyalty

```solidity
function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external
```

Sets royalty information for a specific token.

_Only callable by authorized roles (add access control in production)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | Token id. |
| receiver | address | Address to receive royalties. |
| feeNumerator | uint96 | Royalty fraction. |

### resetTokenRoyalty

```solidity
function resetTokenRoyalty(uint256 tokenId) external
```

Removes royalty information for a specific token.

_Only callable by authorized roles (add access control in production)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | Token id. |

### setFeeDenominator

```solidity
function setFeeDenominator(uint96 newDenominator) external
```

Sets the royalty fee denominator.

_Only callable by accounts with the ROYALTY_ROLE._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newDenominator | uint96 | The new denominator value (must be > 0). |

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)
```

Returns royalty information for a given token and sale price.

_Implements EIP-2981. Returns receiver and royalty amount for the sale._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The identifier of the NFT being sold. |
| salePrice | uint256 | The sale price of the NFT. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | The address to receive the royalty payment. |
| royaltyAmount | uint256 | The royalty payment amount for the sale price. |

### feeDenominator

```solidity
function feeDenominator() external view returns (uint96 denominator)
```

Returns the royalty fee denominator (default 10000).

_Exposes the denominator used for royalty calculations._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| denominator | uint96 | The denominator value. |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```



---

## ERC721RoyaltyFacet

Facet for ERC721 royalty functionality in diamond/facet architectures.

_Exposes external interface for royalty management and queries.
     - Allows setting and querying royalties, fee denominator, and related logic.
     - Should be registered in the diamond with all required selectors._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## ERC721RoyaltyInternal

Internal implementation of EIP-2981 royalty logic for ERC721 tokens.

_Manages royalty info per token and default royalty, for use in diamond/facet architectures._

### RoyaltyInfo

```solidity
struct RoyaltyInfo {
  address receiver;
  uint96 royaltyFraction;
}
```

### ERC721RoyaltyStorage

```solidity
struct ERC721RoyaltyStorage {
  struct ERC721RoyaltyInternal.RoyaltyInfo defaultRoyalty;
  mapping(uint256 => struct ERC721RoyaltyInternal.RoyaltyInfo) tokenRoyalty;
  uint96 feeDenominator;
}
```

### _setDefaultRoyalty

```solidity
function _setDefaultRoyalty(address receiver, uint96 feeNumerator) internal
```

_Sets default royalty info._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | Address to receive royalties. |
| feeNumerator | uint96 | Royalty fraction (e.g. 1000 for 10%). |

### _deleteDefaultRoyalty

```solidity
function _deleteDefaultRoyalty() internal
```

_Removes default royalty info._

### _setTokenRoyalty

```solidity
function _setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) internal
```

_Sets royalty info for a specific token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | Token id. |
| receiver | address | Address to receive royalties. |
| feeNumerator | uint96 | Royalty fraction. |

### _resetTokenRoyalty

```solidity
function _resetTokenRoyalty(uint256 tokenId) internal
```

_Removes royalty info for a specific token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | Token id. |

### _setFeeDenominator

```solidity
function _setFeeDenominator(uint96 newDenominator) internal
```

_Sets the fee denominator for royalty calculations._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newDenominator | uint96 | The new denominator value (must be > 0). |

### _royaltyInfo

```solidity
function _royaltyInfo(uint256 tokenId, uint256 salePrice) internal view returns (address receiver, uint256 royaltyAmount)
```

_Returns royalty info for a token and sale price._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | Token id. |
| salePrice | uint256 | Sale price. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | Royalty receiver. |
| royaltyAmount | uint256 | Royalty amount. |

### _feeDenominator

```solidity
function _feeDenominator() internal view returns (uint96)
```

_Returns the fee denominator (default 10000)._



---

## IERC721Royalty

Interface for ERC721 tokens supporting royalty payments (EIP-2981).
        Allows querying royalty information for a given token and sale price.

_Contracts implementing this interface can signal royalty info for marketplaces and platforms._

### FeeExceedsDenominator

```solidity
error FeeExceedsDenominator()
```

Error thrown when the royalty fee numerator exceeds the allowed denominator.

_Ensures that the royalty fraction does not surpass the maximum allowed value (e.g., 10000 for 100%)._

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)
```

Returns royalty information for a given token and sale price.

_Should return the address to receive the royalty and the royalty amount owed for a sale._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The identifier of the NFT being sold. |
| salePrice | uint256 | The sale price of the NFT. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | The address to receive the royalty payment. |
| royaltyAmount | uint256 | The royalty payment amount for the sale price. |

