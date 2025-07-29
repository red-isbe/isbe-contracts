## ERC721InternalCommon

This abstract contract puts together all ERC721 internal logic (snapshot, cap, and base logic).

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_Override the \_beforeTokenTransfer hook to combine logic from all inherited modules._

### \_baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

Returns the base URI for token metadata.

_Optional internal function to build tokenURI._
