## ISmartAccount

Defines the external surface for a smart account that
interacts with an EntryPoint.

_Conforms to EntryPoint callbacks for user operation validation
and execution._

### SmartAccountInitialized

```solidity
event SmartAccountInitialized(address entryPoint)
```

Emitted when the smart account is successfully initialised.

#### Parameters

| Name       | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| entryPoint | address | The authorised EntryPoint contract. |

### EntryPointUpdated

```solidity
event EntryPointUpdated(address newEntryPoint)
```

Emitted when the entry point is updated in the Smart Account.

#### Parameters

| Name          | Type    | Description                             |
| ------------- | ------- | --------------------------------------- |
| newEntryPoint | address | The new authorised EntryPoint contract. |

### SmartAccount_NotFromEntryPointOrOwner

```solidity
error SmartAccount_NotFromEntryPointOrOwner()
```

Thrown when the caller is not the stored EntryPoint or the contract's owner.

### SmartAccount_NotFromEntryPoint

```solidity
error SmartAccount_NotFromEntryPoint()
```

Thrown when the caller is not the stored EntryPoint

### SmartAccount_CallFailed

```solidity
error SmartAccount_CallFailed(bytes result)
```

Thrown when an execution on behalf of the smart account fails.

#### Parameters

| Name   | Type  | Description               |
| ------ | ----- | ------------------------- |
| result | bytes | The failed call's result. |

### EntryPointInterfaceMismatch

```solidity
error EntryPointInterfaceMismatch(address entryPoint)
```

Thrown when a provided EntryPoint does not implement the required interface.

_Should be raised during initialisation or update if the ERC-165
interface check for {IEntryPoint} fails._

#### Parameters

| Name       | Type    | Description                                     |
| ---------- | ------- | ----------------------------------------------- |
| entryPoint | address | The non-conforming EntryPoint contract address. |

### validateUserOp

```solidity
function validateUserOp(struct PackedUserOperation userOp, bytes32 userOpHash, uint256 missingAccountFunds) external returns (uint256 validationData)
```

Validates a user's signature and processes prefund settlement.

_Must be invoked by EntryPoint. Returns validationData encoding
signature validity. Ensures prefund is paid when required._

#### Parameters

| Name                | Type                       | Description                                                                                                                              |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| userOp              | struct PackedUserOperation | The complete user operation being executed.                                                                                              |
| userOpHash          | bytes32                    | The request hash used for signature verification.                                                                                        |
| missingAccountFunds | uint256                    | Missing funds on the account's deposit in the sender (entrypoint). In case there is a paymaster in the request, this value will be zero. |

#### Return Values

| Name           | Type    | Description                                         |
| -------------- | ------- | --------------------------------------------------- |
| validationData | uint256 | 0 for valid signature, 1 to mark signature failure. |

### execute

```solidity
function execute(address dest, uint256 value, bytes functionData) external
```

Executes a call on behalf of the smart account.

_Requires caller to be EntryPoint or owner. Propagates revert data
on downstream failure. Does not validate calldata shape._

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| dest         | address | The target contract or externally owned account. |
| value        | uint256 | The amount of ETH forwarded with the call.       |
| functionData | bytes   | The ABI-encoded function call data.              |

---

## SmartAccount

Concrete-facing layer that wires external ISmartAccount calls to internal
validation logic for an ERC-4337 smart account.

_Delegates core logic to SmartAccountInternal and exposes EntryPoint callbacks.
Access control and initialisation are expected from inherited mixins.
Uses unstructured storage to remain layout-agnostic across upgrades._

### requireFromEntryPoint

```solidity
modifier requireFromEntryPoint()
```

Restricts execution to calls originating from the EntryPoint.

_Reverts when unauthorised._

### requireFromEntryPointOrOwner

```solidity
modifier requireFromEntryPointOrOwner()
```

Restricts execution to calls from EntryPoint or the account owner.

_Reverts when unauthorised._

### receive

```solidity
receive() external payable
```

### updateEntryPoint

```solidity
function updateEntryPoint(contract IEntryPoint entryPoint) external
```

### initializeSmartAccount

```solidity
function initializeSmartAccount(contract IEntryPoint entryPoint) external
```

Initialises the smart account with an EntryPoint reference.

_Verifies ERC-165 support on the given EntryPoint. Protected by
{initializer} and {addressIsNotZero}. Emits {SmartAccountInitialized}._

#### Parameters

| Name       | Type                 | Description                                  |
| ---------- | -------------------- | -------------------------------------------- |
| entryPoint | contract IEntryPoint | The EntryPoint contract used for validation. |

### validateUserOp

```solidity
function validateUserOp(struct PackedUserOperation userOp, bytes32 userOpHash, uint256 missingAccountFunds) external returns (uint256)
```

Validates a user's signature and processes prefund settlement.

_Must be invoked by EntryPoint. Returns validationData encoding
signature validity. Ensures prefund is paid when required._

#### Parameters

| Name                | Type                       | Description                                                                                                                              |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| userOp              | struct PackedUserOperation | The complete user operation being executed.                                                                                              |
| userOpHash          | bytes32                    | The request hash used for signature verification.                                                                                        |
| missingAccountFunds | uint256                    | Missing funds on the account's deposit in the sender (entrypoint). In case there is a paymaster in the request, this value will be zero. |

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | uint256 |             |

### execute

```solidity
function execute(address dest, uint256 value, bytes functionData) external
```

Executes a call on behalf of the smart account.

_Requires caller to be EntryPoint or owner. Propagates revert data
on downstream failure. Does not validate calldata shape._

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| dest         | address | The target contract or externally owned account. |
| value        | uint256 | The amount of ETH forwarded with the call.       |
| functionData | bytes   | The ABI-encoded function call data.              |

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) external pure returns (bytes4)
```

Handles the receipt of an ERC721 token.

_Called by the ERC721 contract after a safe transfer. Must return its selector to confirm the token transfer.
If any other value is returned or the interface is not implemented, the transfer will be reverted._

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
|      | address |             |
|      | address |             |
|      | uint256 |             |
|      | bytes   |             |

#### Return Values

| Name | Type   | Description                                 |
| ---- | ------ | ------------------------------------------- |
| [0]  | bytes4 | The selector to confirm the token transfer. |

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) external pure returns (bytes4)
```

\_Handles the receipt of a single ERC1155 token type. This function is
called at the end of a `safeTransferFrom` after the balance has been updated.

NOTE: To accept the transfer, this must return
`bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
(i.e. 0xf23a6e61, or its own function selector).\_

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
|      | address |             |
|      | address |             |
|      | uint256 |             |
|      | uint256 |             |
|      | bytes   |             |

#### Return Values

| Name | Type   | Description                                                                                            |
| ---- | ------ | ------------------------------------------------------------------------------------------------------ |
| [0]  | bytes4 | `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed |

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) external pure returns (bytes4)
```

\_Handles the receipt of a multiple ERC1155 token types. This function
is called at the end of a `safeBatchTransferFrom` after the balances have
been updated.

NOTE: To accept the transfer(s), this must return
`bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
(i.e. 0xbc197c81, or its own function selector).\_

#### Parameters

| Name | Type      | Description |
| ---- | --------- | ----------- |
|      | address   |             |
|      | address   |             |
|      | uint256[] |             |
|      | uint256[] |             |
|      | bytes     |             |

#### Return Values

| Name | Type   | Description                                                                                                     |
| ---- | ------ | --------------------------------------------------------------------------------------------------------------- |
| [0]  | bytes4 | `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Declares supported interfaces for ERC-165 discovery.

#### Return Values

| Name         | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface identifiers. |

---

## SmartAccountFacet

EIP-2535 facet that exposes ERC-4337 smart account functionality for modular proxy systems.

_Implements introspection for diamond compatibility and delegates core logic to
the {SmartAccount} base contract. Provides metadata about supported interfaces,
business identifiers, and exposed function selectors. Enables dynamic discovery
and upgrade management within a facet-based architecture._

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

## SmartAccountInternal

Provides core internal functionality for a decentralised smart account.

_Uses unstructured storage to keep layout decentralised across inheritance.
Handles signature validation, prefund settlement and controlled execution.
Designed for integration with EntryPoint-based account abstraction flows.
Ownership controls are inherited and used to authorise privileged calls.
Expects external orchestration via the EntryPoint contract._

### SmartAccountStorage

```solidity
struct SmartAccountStorage {
  contract IEntryPoint entryPoint;
}
```

### \_initializeSmartAccount

```solidity
function _initializeSmartAccount(contract IEntryPoint entryPoint) internal
```

Sets the ERC-4337 EntryPoint reference.

_Caller MUST ensure single-run semantics during initialisation phases._

#### Parameters

| Name       | Type                 | Description              |
| ---------- | -------------------- | ------------------------ |
| entryPoint | contract IEntryPoint | The EntryPoint contract. |

### \_setEntryPoint

```solidity
function _setEntryPoint(contract IEntryPoint entryPoint) internal
```

Updates the EntryPoint reference.

_No access control is enforced here; the parent should restrict calls._

#### Parameters

| Name       | Type                 | Description              |
| ---------- | -------------------- | ------------------------ |
| entryPoint | contract IEntryPoint | The EntryPoint to store. |

### \_validateEntryPointInterface

```solidity
function _validateEntryPointInterface(contract IEntryPoint entryPoint) internal virtual
```

Verifies the provided EntryPoint implements the expected interface.

_Reverts with EntryPointInterfaceMismatch defined in ISmartAccount when the
target does not report support for IEntryPoint via ERC-165._

#### Parameters

| Name       | Type                 | Description                          |
| ---------- | -------------------- | ------------------------------------ |
| entryPoint | contract IEntryPoint | The EntryPoint instance to validate. |

### \_execute

```solidity
function _execute(address dest, uint256 value, bytes functionData) internal
```

Executes a call on behalf of the smart account.

_Requires caller to be EntryPoint or owner. Propagates revert data
on downstream failure. Does not validate calldata shape._

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| dest         | address | The target contract or externally owned account. |
| value        | uint256 | The amount of ETH forwarded with the call.       |
| functionData | bytes   | The ABI-encoded function call data.              |

### \_validateUserOp

```solidity
function _validateUserOp(struct PackedUserOperation userOp, bytes32 userOpHash, uint256 missingAccountFunds) internal returns (uint256 validationData)
```

Validates a user's signature and processes prefund settlement.

_Must be invoked by EntryPoint. Returns validationData encoding
signature validity. Ensures prefund is paid when required._

#### Parameters

| Name                | Type                       | Description                                                                                                                              |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| userOp              | struct PackedUserOperation | The complete user operation being executed.                                                                                              |
| userOpHash          | bytes32                    | The request hash used for signature verification.                                                                                        |
| missingAccountFunds | uint256                    | Missing funds on the account's deposit in the sender (entrypoint). In case there is a paymaster in the request, this value will be zero. |

#### Return Values

| Name           | Type    | Description                                         |
| -------------- | ------- | --------------------------------------------------- |
| validationData | uint256 | 0 for valid signature, 1 to mark signature failure. |

### \_requireFromEntryPoint

```solidity
function _requireFromEntryPoint() internal view
```

Restricts execution to calls originating from the EntryPoint.

_Reverts when unauthorised._

### \_requireFromEntryPointOrOwner

```solidity
function _requireFromEntryPointOrOwner() internal view
```

Restricts execution to calls from EntryPoint or the account owner.

_Reverts when unauthorised._
