## ERC203643TransferSigned

Abstract contract implementing signed transfer functionality for ERC203643 tokens

_Extends ERC203643InternalCommon and ERC721Internal to provide signature-based transfer mechanisms.
     Requires _SPONSOR_ROLE for external function access. Integrates with signature verification utilities._

### constructor

```solidity
constructor() internal
```

### transferWithSignature

```solidity
function transferWithSignature(address _to, uint256 _amount, address _sender, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Transfers tokens based on a signed message from the sender

_Verifies the signature using EIP-712 typed data before executing the transfer.
     Only callable when not paused and by accounts with _SPONSOR_ROLE.
     Emits a WithSignatureTransferred event upon successful transfer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The address to transfer tokens to |
| _amount | uint256 | The amount of tokens to transfer |
| _sender | address | The address of the token sender (signer) |
| _deadline | uint256 | Unix timestamp after which the signature is invalid |
| _nonce | uint256 | Unique number to prevent replay attacks |
| _signature | bytes | Signature of the transaction data |

### transferFromWithSignature

```solidity
function transferFromWithSignature(address _from, address _to, uint256 _amount, address _sender, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Transfers tokens from one address to another based on a signed message

_Verifies the signature using EIP-712 typed data, spends the sender's allowance,
     then executes the transfer. Only callable when not paused and by accounts with _SPONSOR_ROLE.
     Emits a WithSignatureTransferred event upon successful transfer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | The address to transfer tokens from |
| _to | address | The address to transfer tokens to |
| _amount | uint256 | The amount of tokens to transfer |
| _sender | address | The address of the transaction sponsor (signer) |
| _deadline | uint256 | Unix timestamp after which the signature is invalid |
| _nonce | uint256 | Unique number to prevent replay attacks |
| _signature | bytes | Signature of the transaction data |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this contract

_Overrides the base implementation to specify IERC203643TransferSigned interface support_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of interface identifiers supported by this contract |



---

## ERC203643TransferSignedFacet

Implements EIP-2535 introspection for the ERC203643 transfer signed module

_Provides interface and selector introspection capabilities for diamond proxy integration.
     Inherits ERC203643TransferSigned functionality and implements IEIP2535Introspection._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this contract

_Overrides the base implementation to specify supported interface identifiers_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of interface identifiers supported by this contract |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this contract module

_Returns the resolver key constant used to identify this module in the diamond proxy_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The business identifier for this contract module |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the list of function selectors implemented by this contract

_Overrides the base implementation to specify supported function selectors_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | Array of function selectors supported by this contract |



---

## IERC203643TransferSigned

Defines the interface for transferring tokens with cryptographic signatures

_Provides methods for signed transfers to enable off-chain approvals and decentralised transactions_

### WithSignatureTransferred

```solidity
event WithSignatureTransferred(address from, address to, uint256 amount, address sender, uint256 deadline, uint256 nonce, bytes signature)
```

Event emitted when a transfer is executed using a signature

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address initiating the transfer (indexed) |
| to | address | Recipient address (indexed) |
| amount | uint256 | Amount of tokens transferred |
| sender | address | Original signer of the transaction (indexed) |
| deadline | uint256 | Timestamp after which the signature is invalid |
| nonce | uint256 | Unique identifier for this specific transfer operation |
| signature | bytes | Cryptographic signature authorising the transfer |

### transferWithSignature

```solidity
function transferWithSignature(address _to, uint256 _amount, address _sender, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Transfers tokens using a cryptographic signature instead of approvals

_Allows off-chain signing for decentralised transfers without prior allowance_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | Recipient address |
| _amount | uint256 | Amount to transfer |
| _sender | address | Original signer who authorised the transaction |
| _deadline | uint256 | Timestamp after which signature becomes invalid |
| _nonce | uint256 | Unique identifier for this specific transfer operation |
| _signature | bytes | Cryptographic signature authorising the transfer |

### transferFromWithSignature

```solidity
function transferFromWithSignature(address _from, address _to, uint256 _amount, address _sender, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Transfers tokens from one account to another using a signature (pull payment)

_Allows off-chain signing for decentralised transfers without prior allowance
     Similar to transferWithSignature but with explicit sender specification_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | Account from which tokens are transferred |
| _to | address | Recipient address |
| _amount | uint256 | Amount to transfer |
| _sender | address | Original signer who authorised the transaction |
| _deadline | uint256 | Timestamp after which signature becomes invalid |
| _nonce | uint256 | Unique identifier for this specific transfer operation |
| _signature | bytes | Cryptographic signature authorising the transfer |

