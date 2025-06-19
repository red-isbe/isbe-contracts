## ISBEContext

### AddressZero

```solidity
error AddressZero(address addr)
```

_Emitted when the provided `addr` is 0_

#### Parameters

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| addr | address | The address to check |

### UnimplementedMethod

```solidity
error UnimplementedMethod()
```

### \_blockTimestamp

```solidity
function _blockTimestamp() internal view virtual returns (uint256)
```

### \_msgSig

```solidity
function _msgSig() internal view virtual returns (bytes4)
```

### \_addressIsNotZero

```solidity
function _addressIsNotZero(address addr) internal pure
```

_Checks if an address equals to zero address_

#### Parameters

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| addr | address | The address to check |
