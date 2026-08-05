## MessageHashUtils

_Signature message hash utilities for producing digests to be consumed by {ECDSA} recovery or signing.

The library provides methods for generating a hash of a message that conforms to the
https://eips.ethereum.org/EIPS/eip-191[ERC-191] and https://eips.ethereum.org/EIPS/eip-712[EIP 712]
specifications._

### toEthSignedMessageHash

```solidity
function toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32 digest)
```

_Returns the keccak256 digest of an ERC-191 signed data with version
`0x45` (`personal_sign` messages).

The digest is calculated by prefixing a bytes32 `messageHash` with
`"\x19Ethereum Signed Message:\n32"` and hashing the result. It corresponds with the
hash signed when using the https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign[`eth_sign`]
JSON-RPC method.

NOTE: The `messageHash` parameter is intended to be the result of hashing a raw message with
keccak256, although any bytes32 value can be safely used because the final digest will
be re-hashed.

See {ECDSA-recover}._

### toTypedDataHash

```solidity
function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32 digest)
```

_Returns the keccak256 digest of an EIP-712 typed data (ERC-191 version `0x01`).

The digest is calculated from a `domainSeparator` and a `structHash`, by prefixing them with
`\x19\x01` and hashing the result. It corresponds to the hash signed by the
https://eips.ethereum.org/EIPS/eip-712[`eth_signTypedData`] JSON-RPC method as part of EIP-712.

See {ECDSA-recover}._



---

## UserOperationLib

Utility functions helpful when working with UserOperation structs.

### ADDRESS_LENGTH_OFFSET

```solidity
uint256 ADDRESS_LENGTH_OFFSET
```

### PACKED_USEROP_TYPEHASH

```solidity
bytes32 PACKED_USEROP_TYPEHASH
```

### encode

```solidity
function encode(struct PackedUserOperation userOp) internal pure returns (bytes ret)
```

Pack the user operation data into bytes for hashing.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct PackedUserOperation | - The user operation data. |

### unpackUints

```solidity
function unpackUints(bytes32 packed) internal pure returns (uint256 high128, uint256 low128)
```

### unpackHigh128

```solidity
function unpackHigh128(bytes32 packed) internal pure returns (uint256)
```

### unpackLow128

```solidity
function unpackLow128(bytes32 packed) internal pure returns (uint256)
```

### hash

```solidity
function hash(struct PackedUserOperation userOp) internal pure returns (bytes32)
```

Hash the user operation data.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct PackedUserOperation | - The user operation data. |

