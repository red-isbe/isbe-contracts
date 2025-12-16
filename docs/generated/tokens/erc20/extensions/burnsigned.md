## ERC20BurnableSigned

Abstract contract implementing signed burn functionality for ERC203643 tokens

_Extends ERC203643InternalCommon and ERC721Internal to provide signature-based burn mechanisms.
Requires \_SPONSOR_ROLE for external function access. Integrates with signature verification utilities._

### constructor

```solidity
constructor() internal
```

### burnWithSignature

```solidity
function burnWithSignature(address _account, uint256 _amount, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Burns tokens from the caller's account based on a signed message

_Verifies the signature using EIP-712 typed data before executing the burn.
Only callable when not paused and by accounts with \_SPONSOR_ROLE.
Emits a WithSignatureBurned event upon successful burn._

#### Parameters

| Name        | Type    | Description                                         |
| ----------- | ------- | --------------------------------------------------- |
| \_account   | address | The address whose tokens are being burned           |
| \_amount    | uint256 | The amount of tokens to burn                        |
| \_deadline  | uint256 | Unix timestamp after which the signature is invalid |
| \_nonce     | uint256 | Unique number to prevent replay attacks             |
| \_signature | bytes   | Signature of the transaction data                   |

### burnFromWithSignature

```solidity
function burnFromWithSignature(address _sender, address _account, uint256 _amount, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Burns tokens from a specific account using a signed message (pull payment)

_Verifies the signature using EIP-712 typed data, spends the sender's allowance,
then executes the burn. Only callable when not paused and by accounts with \_SPONSOR_ROLE.
Emits a WithSignatureBurnedFrom event upon successful burn._

#### Parameters

| Name        | Type    | Description                                         |
| ----------- | ------- | --------------------------------------------------- |
| \_sender    | address | The address of the transaction sponsor (signer)     |
| \_account   | address | The address whose tokens are being burned           |
| \_amount    | uint256 | The amount of tokens to burn                        |
| \_deadline  | uint256 | Unix timestamp after which the signature is invalid |
| \_nonce     | uint256 | Unique number to prevent replay attacks             |
| \_signature | bytes   | Signature of the transaction data                   |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this contract

_Overrides the base implementation to specify IERC20BurnableSigned interface support_

#### Return Values

| Name         | Type     | Description                                               |
| ------------ | -------- | --------------------------------------------------------- |
| interfaces\_ | bytes4[] | Array of interface identifiers supported by this contract |

---

## ERC20BurnableSignedFacet

Implements EIP-2535 introspection for the ERC203643 burnable signed module

_Provides interface and selector introspection capabilities for diamond proxy integration.
Inherits ERC20BurnableSigned functionality and implements IEIP2535Introspection._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this contract

_Overrides the base implementation to specify supported interface identifiers_

#### Return Values

| Name         | Type     | Description                                               |
| ------------ | -------- | --------------------------------------------------------- |
| interfaces\_ | bytes4[] | Array of interface identifiers supported by this contract |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this contract module

_Returns the resolver key constant used to identify this module in the diamond proxy_

#### Return Values

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| businessId\_ | bytes32 | The business identifier for this contract module |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the list of function selectors implemented by this contract

_Overrides the base implementation to specify supported function selectors_

#### Return Values

| Name        | Type     | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| selectors\_ | bytes4[] | Array of function selectors supported by this contract |

---

## IERC20BurnableSigned

Defines the interface for burning tokens with cryptographic signatures

_Provides methods for signed burns to enable off-chain approvals and decentralised token destruction_

### WithSignatureBurned

```solidity
event WithSignatureBurned(address account, uint256 amount, uint256 deadline, uint256 nonce, bytes signature)
```

Event emitted when a burn is executed using a signature

#### Parameters

| Name      | Type    | Description                                        |
| --------- | ------- | -------------------------------------------------- |
| account   | address | Address whose tokens are being burned (indexed)    |
| amount    | uint256 | Amount of tokens burned                            |
| deadline  | uint256 | Timestamp after which the signature is invalid     |
| nonce     | uint256 | Unique identifier for this specific burn operation |
| signature | bytes   | Cryptographic signature authorising the burn       |

### WithSignatureBurnedFrom

```solidity
event WithSignatureBurnedFrom(address sender, address account, uint256 amount, uint256 deadline, uint256 nonce, bytes signature)
```

Event emitted when a burnFrom is executed using a signature

#### Parameters

| Name      | Type    | Description                                              |
| --------- | ------- | -------------------------------------------------------- |
| sender    | address | Original signer who authorised the transaction (indexed) |
| account   | address | Address whose tokens are being burned (indexed)          |
| amount    | uint256 | Amount of tokens burned                                  |
| deadline  | uint256 | Timestamp after which the signature is invalid           |
| nonce     | uint256 | Unique identifier for this specific burn operation       |
| signature | bytes   | Cryptographic signature authorising the burn             |

### burnWithSignature

```solidity
function burnWithSignature(address _account, uint256 _amount, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Burns tokens from the caller's account using a cryptographic signature

_Allows off-chain signing for decentralised token burning without prior allowance_

#### Parameters

| Name        | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| \_account   | address | Address whose tokens are being burned              |
| \_amount    | uint256 | Amount to burn                                     |
| \_deadline  | uint256 | Timestamp after which signature becomes invalid    |
| \_nonce     | uint256 | Unique identifier for this specific burn operation |
| \_signature | bytes   | Cryptographic signature authorising the burn       |

### burnFromWithSignature

```solidity
function burnFromWithSignature(address _sender, address _account, uint256 _amount, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Burns tokens from a specific account using a cryptographic signature (pull payment)

_Allows off-chain signing for decentralised token burning without prior allowance
Similar to burnWithSignature but with explicit account specification_

#### Parameters

| Name        | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| \_sender    | address | Original signer who authorised the transaction     |
| \_account   | address | Address whose tokens are being burned              |
| \_amount    | uint256 | Amount to burn                                     |
| \_deadline  | uint256 | Timestamp after which signature becomes invalid    |
| \_nonce     | uint256 | Unique identifier for this specific burn operation |
| \_signature | bytes   | Cryptographic signature authorising the burn       |
