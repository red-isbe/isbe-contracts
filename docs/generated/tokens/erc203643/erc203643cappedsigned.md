## ERC203643CappedSigned

Abstract contract implementing signed minting functionality for ERC203543 capped tokens

_Extends ERC203643InternalCommon and ERC721Internal to provide signature-based minting mechanisms.
Requires \_SPONSOR_ROLE for external function access. Integrates with signature verification utilities.
Enforces cap limits on total supply._

### constructor

```solidity
constructor() internal
```

### mintWithSignature

```solidity
function mintWithSignature(address _to, uint256 _amount, address _sender, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Mints new tokens based on a signed message

_Verifies the signature using EIP-712 typed data before executing the mint.
Only callable when not paused and by accounts with \_SPONSOR_ROLE.
Enforces cap limits on total supply.
Emits a WithSignatureMinted event upon successful minting._

#### Parameters

| Name        | Type    | Description                                         |
| ----------- | ------- | --------------------------------------------------- |
| \_to        | address | The address to mint tokens to                       |
| \_amount    | uint256 | The amount of tokens to mint                        |
| \_sender    | address | The address of the token minter (signer)            |
| \_deadline  | uint256 | Unix timestamp after which the signature is invalid |
| \_nonce     | uint256 | Unique number to prevent replay attacks             |
| \_signature | bytes   | Signature of the minting data                       |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this contract

_Overrides the base implementation to specify IERC203543CappedSigned interface support_

#### Return Values

| Name         | Type     | Description                                               |
| ------------ | -------- | --------------------------------------------------------- |
| interfaces\_ | bytes4[] | Array of interface identifiers supported by this contract |

---

## ERC203643CappedSignedFacet

Implements EIP-2535 introspection for the ERC203543 capped signed module

_Provides interface and selector introspection capabilities for diamond proxy integration.
Inherits ERC203543CappedSigned functionality and implements IEIP2535Introspection._

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

## IERC203643CappedSigned

Defines the interface for minting capped tokens with cryptographic signatures

_Provides methods for signed minting to enable off-chain approvals and decentralised minting within cap limits_

### WithSignatureMinted

```solidity
event WithSignatureMinted(address to, uint256 amount, address sender, uint256 deadline, uint256 nonce, bytes signature)
```

Event emitted when tokens are minted using a signature

#### Parameters

| Name      | Type    | Description                                           |
| --------- | ------- | ----------------------------------------------------- |
| to        | address | Recipient address (indexed)                           |
| amount    | uint256 | Amount of tokens minted                               |
| sender    | address | Original signer who authorised the minting (indexed)  |
| deadline  | uint256 | Timestamp after which the signature is invalid        |
| nonce     | uint256 | Unique identifier for this specific minting operation |
| signature | bytes   | Cryptographic signature authorising the minting       |

### mintWithSignature

```solidity
function mintWithSignature(address _to, uint256 _amount, address _sender, uint256 _deadline, uint256 _nonce, bytes _signature) external
```

Mints new tokens using a cryptographic signature instead of direct access control

_Allows off-chain signing for decentralised minting without direct role requirements_

#### Parameters

| Name        | Type    | Description                                           |
| ----------- | ------- | ----------------------------------------------------- |
| \_to        | address | Recipient address                                     |
| \_amount    | uint256 | Amount to mint                                        |
| \_sender    | address | Original signer who authorised the minting            |
| \_deadline  | uint256 | Timestamp after which signature becomes invalid       |
| \_nonce     | uint256 | Unique identifier for this specific minting operation |
| \_signature | bytes   | Cryptographic signature authorising the minting       |
