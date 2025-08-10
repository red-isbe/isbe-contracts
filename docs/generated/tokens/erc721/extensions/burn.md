## ERC721Burnable

Implements burn mechanism for ERC721 tokens

_Inherits from IERC721Burnable and ERC721InternalCommon_

### burn

```solidity
function burn(uint256 tokenId) external
```

Burns a specific token owned by the caller.

_The caller must own the token or be an approved operator.
Emits a Transfer event to the zero address._

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| tokenId | uint256 | The identifier of the token to burn. |

### burnFrom

```solidity
function burnFrom(address owner, uint256 tokenId) external
```

Burns a specific token from another account, if the caller is approved or operator.

_The caller must be approved or operator for the token.
Emits a Transfer event to the zero address._

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| owner   | address | The address of the token owner.      |
| tokenId | uint256 | The identifier of the token to burn. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC721BurnableFacet

Facet for burnable functionality in ERC721 tokens for diamond/facet architectures.

_Exposes external interface for burning tokens and burning from another account. - Should be registered in the diamond with all required selectors for burnable logic._

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

## IERC721Burnable

Interface for ERC721 tokens that support token burning.
Allows users or approved accounts to destroy NFTs, reducing the total supply.

_This interface defines two methods: - `burn`: Burns a specific token owned by the caller. - `burnFrom`: Burns a specific token from another account, if the caller is approved or operator.
Implementing contracts are expected to handle the necessary checks and emit the `Transfer` event
with the recipient set to the zero address to reflect the burn._

### burn

```solidity
function burn(uint256 tokenId) external
```

Burns a specific token owned by the caller.

_Destroys the `tokenId` token, reducing the total supply.
The caller must own the token or be an approved operator.
Implementations should emit a `Transfer` event to the zero address._

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| tokenId | uint256 | The identifier of the token to burn. |

### burnFrom

```solidity
function burnFrom(address owner, uint256 tokenId) external
```

Burns a specific token from another account, if the caller is approved or operator.

_Destroys the `tokenId` token owned by `owner`, reducing the total supply.
The caller must be approved or operator for the token.
Implementations should emit a `Transfer` event to the zero address._

#### Parameters

| Name    | Type    | Description                          |
| ------- | ------- | ------------------------------------ |
| owner   | address | The address of the token owner.      |
| tokenId | uint256 | The identifier of the token to burn. |
