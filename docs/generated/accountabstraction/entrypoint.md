## EntryPoint

Concrete ERC-4337 style EntryPoint exposing the public interface for
user operations, staking and nonce management.

_Bridges the external IEntryPoint, IStakeManager and INonceManager
interfaces with the internal logic implemented in EntryPointInternal.
Integrates ERC165 introspection and a re-entrancy guard. Designed to be
used as a facet / module in an upgradeable, resolver-based system._

### depositTo

```solidity
function depositTo(address account) external payable virtual
```

Increments the deposit balance of a given account.

_Accepts Ether and increments the internal deposit for `account`.
Emits `Deposited` with the new deposit amount. Pausable via
`whenNotPaused`._

#### Parameters

| Name    | Type    | Description                                 |
| ------- | ------- | ------------------------------------------- |
| account | address | Address whose deposit balance is increased. |

### addStake

```solidity
function addStake(uint32 unstakeDelaySec) external payable
```

Adds or increases the stake for the calling account.

_Locks additional stake for the caller with the specified unstake
delay. Emits `StakeLocked`. Pausable via `whenNotPaused`._

#### Parameters

| Name            | Type   | Description                                                        |
| --------------- | ------ | ------------------------------------------------------------------ |
| unstakeDelaySec | uint32 | Required delay in seconds before stake withdrawal after unlocking. |

### handleOps

```solidity
function handleOps(struct PackedUserOperation[] ops, address payable beneficiary) external
```

Processes a batch of user operations.

_Protected by `whenNotPaused` and `nonReentrant("handleops")` to
prevent concurrent re-entry into batch processing._

#### Parameters

| Name        | Type                         | Description                                                             |
| ----------- | ---------------------------- | ----------------------------------------------------------------------- |
| ops         | struct PackedUserOperation[] | Array of packed user operations to be processed.                        |
| beneficiary | address payable              | Address that receives the collected fees for gas consumed by the batch. |

### incrementNonce

```solidity
function incrementNonce(uint192 key) external
```

Increments the nonce for the message sender and specified key.

_Increments the caller's nonce for the given key. Used for manual
nonce management outside of user operations._

#### Parameters

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| key  | uint192 | The 192-bit key identifying the nonce sequence to increment. |

### unlockStake

```solidity
function unlockStake() external
```

Initiates the unstaking process for the calling account.

_Starts the unstaking process for the caller. Emits
`StakeUnlocked` with the timestamp after which stake can be
withdrawn. Pausable via `whenNotPaused`._

### withdrawStake

```solidity
function withdrawStake(address payable withdrawAddress) external
```

Withdraws the caller's staked Ether once the unstake delay
has passed.

_Withdraws the caller's unlocked stake to `withdrawAddress`. Emits
`StakeWithdrawn`. Pausable via `whenNotPaused`._

#### Parameters

| Name            | Type            | Description                                        |
| --------------- | --------------- | -------------------------------------------------- |
| withdrawAddress | address payable | Destination address receiving the withdrawn stake. |

### withdrawTo

```solidity
function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external
```

Withdraws a specific amount from the caller's deposit
balance.

_Withdraws `withdrawAmount` from the caller's deposit to
`withdrawAddress`. Emits `Withdrawn`. Pausable via `whenNotPaused`._

#### Parameters

| Name            | Type            | Description                                         |
| --------------- | --------------- | --------------------------------------------------- |
| withdrawAddress | address payable | Destination address receiving the withdrawn funds.  |
| withdrawAmount  | uint256         | Amount in wei to withdraw from the deposit balance. |

### getNonce

```solidity
function getNonce(address sender, uint192 key) external view returns (uint256 nonce)
```

Retrieves the current full nonce for a given sender and key.

_Returns the current nonce for the specified sender and key, as
tracked by the internal nonce manager._

#### Parameters

| Name   | Type    | Description                                           |
| ------ | ------- | ----------------------------------------------------- |
| sender | address | The address whose nonce is being retrieved.           |
| key    | uint192 | The 192-bit key identifying a logical nonce sequence. |

#### Return Values

| Name  | Type    | Description                                                   |
| ----- | ------- | ------------------------------------------------------------- |
| nonce | uint256 | The composite nonce value, combining key and sequence number. |

### getUserOpHash

```solidity
function getUserOpHash(struct PackedUserOperation userOp) external view returns (bytes32)
```

Computes the hash for a given user operation.

_Forwards to the internal EIP-712-aware hash computation._

#### Parameters

| Name   | Type                       | Description                                   |
| ------ | -------------------------- | --------------------------------------------- |
| userOp | struct PackedUserOperation | Packed user operation structure to be hashed. |

#### Return Values

| Name | Type    | Description                                                    |
| ---- | ------- | -------------------------------------------------------------- |
| [0]  | bytes32 | bytes32 Hash of the user operation for signature verification. |

### getDepositInfo

```solidity
function getDepositInfo(address account) external view returns (struct IStakeManager.DepositInfo info)
```

Retrieves the complete deposit and stake information for an
account.

_Reads deposit and stake details from the internal stake manager
storage._

#### Parameters

| Name    | Type    | Description                           |
| ------- | ------- | ------------------------------------- |
| account | address | Address of the account being queried. |

#### Return Values

| Name | Type                             | Description                                             |
| ---- | -------------------------------- | ------------------------------------------------------- |
| info | struct IStakeManager.DepositInfo | `DepositInfo` structure with deposit and stake details. |

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

Retrieves the deposit balance of an account.

_Returns the current deposit balance held for the given account._

#### Parameters

| Name    | Type    | Description               |
| ------- | ------- | ------------------------- |
| account | address | Address of the depositor. |

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | uint256 |             |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

Lists the interface identifiers implemented by this contract.

_Used by ERC165 to advertise support for IEntryPoint, IStakeManager
and INonceManager. The returned array is consumed by the base
ERC165 implementation._

#### Return Values

| Name         | Type     | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| interfaces\_ | bytes4[] | Array of supported ERC165 interface identifiers. |

---

## EntryPointFacet

EIP-2535 facet exposing the EntryPoint functionality and
introspection metadata.

_Wraps the EntryPoint implementation and provides selector,
interface and business identifier introspection required by
EIP-2535 compatible proxies._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the list of interfaces implemented by this facet.

_Forwards to the internal `_implementedInterfaces` helper
from the EntryPoint base. Used by the diamond to expose
ERC-165 interface support per facet._

#### Return Values

| Name         | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier associated with this facet.

_The business identifier is used by the resolver to map
this facet to a specific functional domain (EntryPoint)._

#### Return Values

| Name         | Type    | Description                            |
| ------------ | ------- | -------------------------------------- |
| businessId\_ | bytes32 | Resolver key for the EntryPoint facet. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns all function selectors implemented by this facet.

_Enumerates the selectors of the EntryPoint surface and
the internal `innerHandleOp` used by the core execution
flow. The order is not semantically relevant but must
include every selector owned by the facet._

#### Return Values

| Name        | Type     | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| selectors\_ | bytes4[] | Array of function selectors implemented by this facet. |

---

## EntryPointInternal

Core internal implementation for ERC-4337 style EntryPoint
operations.

_Implements validation, execution and accounting for user operations.
Extends StakeManagerInternal and NonceManagerInternal, and uses
EIP-712 for domain separation. This abstract contract is intended
to be used as an internal logic mixin and not deployed directly._

### constructor

```solidity
constructor() internal
```

Initialises the EIP-712 domain separator.

_Sets up the typed data domain for user operation hashing and
signature verification._

### innerHandleOp

```solidity
function innerHandleOp(bytes callData, struct IEntryPoint.UserOpInfo opInfo) external returns (uint256 actualGasCost)
```

Executes an internal operation on behalf of the EntryPoint.

_Only callable via a low-level call from this contract itself.
Enforces \_msgSender() == address(this) (AA92). Verifies that
sufficient gas remains for call and paymaster postOp, executes
the user call, derives the post-operation mode, and finally
calls \_postExecution to charge gas and run postOp._

#### Parameters

| Name     | Type                          | Description                                                 |
| -------- | ----------------------------- | ----------------------------------------------------------- |
| callData | bytes                         | Encoded function call to be executed on the sender account. |
| opInfo   | struct IEntryPoint.UserOpInfo | Struct containing pre-validated operation data.             |

#### Return Values

| Name          | Type    | Description                                       |
| ------------- | ------- | ------------------------------------------------- |
| actualGasCost | uint256 | Total gas cost incurred by this operation in wei. |

### \_handleOps

```solidity
function _handleOps(struct PackedUserOperation[] ops, address payable beneficiary) internal
```

Handles the main batch execution of user operations.

_Validates all operations, executes them and settles accounts
in a single atomic process. Emits BeforeExecution once before
executing the batch and uses collected gas to compensate the
beneficiary._

#### Parameters

| Name        | Type                         | Description                                   |
| ----------- | ---------------------------- | --------------------------------------------- |
| ops         | struct PackedUserOperation[] | Array of packed user operations to process.   |
| beneficiary | address payable              | Address receiving collected gas compensation. |

### \_validateSingleUserOp

```solidity
function _validateSingleUserOp(uint256 opIndex, struct PackedUserOperation userOp) internal returns (struct IEntryPoint.UserOpInfo opInfo)
```

Validates a single user operation and prepares its metadata.

_Performs core validation (copy into memory, gas checks, nonce,
hash, prefund, initCode, validateUserOp), then validates
time-range and aggregator data and charges the paymaster
prefund. Reverts with appropriate AA errors on failure._

#### Parameters

| Name    | Type                       | Description                              |
| ------- | -------------------------- | ---------------------------------------- |
| opIndex | uint256                    | Index of the operation within the batch. |
| userOp  | struct PackedUserOperation | Packed user operation being validated.   |

#### Return Values

| Name   | Type                          | Description                                                                  |
| ------ | ----------------------------- | ---------------------------------------------------------------------------- |
| opInfo | struct IEntryPoint.UserOpInfo | Populated user operation metadata for later use in execution and accounting. |

### \_executeUserOp

```solidity
function _executeUserOp(uint256 opIndex, struct PackedUserOperation userOp, struct IEntryPoint.UserOpInfo opInfo) internal returns (uint256 collected)
```

Executes a user operation and handles its revert paths.

_Calls innerHandleOp via \_callExecuteUserOp, interprets the
revert code produced by inner execution and either: - returns the inner collected value on success, - reverts with AA95 on inner out-of-gas, - handles low prefund paths, or - handles generic reverts with events and postOp._

#### Parameters

| Name    | Type                          | Description                                          |
| ------- | ----------------------------- | ---------------------------------------------------- |
| opIndex | uint256                       | Index of the operation within the batch.             |
| userOp  | struct PackedUserOperation    | Packed user operation being executed.                |
| opInfo  | struct IEntryPoint.UserOpInfo | Metadata and prefund information for this operation. |

#### Return Values

| Name      | Type    | Description                                                       |
| --------- | ------- | ----------------------------------------------------------------- |
| collected | uint256 | Amount effectively collected from the prefund for this operation. |

### \_getUserOpHash

```solidity
function _getUserOpHash(struct PackedUserOperation userOp) internal view returns (bytes32)
```

Computes the hash for a given user operation.

_Uses the current EIP-712 domain separator and the packed user
operation hash as produced by UserOperationLib.hash._

#### Parameters

| Name   | Type                       | Description                      |
| ------ | -------------------------- | -------------------------------- |
| userOp | struct PackedUserOperation | Packed user operation structure. |

#### Return Values

| Name | Type    | Description                                                |
| ---- | ------- | ---------------------------------------------------------- |
| [0]  | bytes32 | bytes32 User operation hash used for signature validation. |

### \_copyUserOpToMemory

```solidity
function _copyUserOpToMemory(struct PackedUserOperation userOp, struct IEntryPoint.MemoryUserOp mUserOp) internal pure
```

Copies data from a packed user operation into a memory
struct.

_Unpacks gas fields and paymaster fields using UserOperationLib.
Requires non-empty paymasterAndData (AA93)._

#### Parameters

| Name    | Type                            | Description                                       |
| ------- | ------------------------------- | ------------------------------------------------- |
| userOp  | struct PackedUserOperation      | Packed user operation calldata.                   |
| mUserOp | struct IEntryPoint.MemoryUserOp | Destination in-memory struct for unpacked fields. |

---

## EntryPointMemoryUtils

Provides low-level memory helpers used by the EntryPoint.

_Wraps common free memory pointer and revert-code handling patterns
in reusable internal functions to keep assembly usage localised and
explicit._

### \_getFreePtr

```solidity
function _getFreePtr() internal pure returns (uint256 ptr)
```

Returns the current free memory pointer.

_Reads the Solidity free memory pointer at slot 0x40. Intended to be
paired with {\_restoreFreePtr} to preserve the memory allocator
state across temporary manual allocations._

#### Return Values

| Name | Type    | Description                               |
| ---- | ------- | ----------------------------------------- |
| ptr  | uint256 | Current value of the free memory pointer. |

### \_restoreFreePtr

```solidity
function _restoreFreePtr(uint256 ptr) internal pure
```

Restores the free memory pointer to a previous value.

_Writes the provided pointer back into slot 0x40. Call this after
using temporary scratch memory to avoid leaking memory and to keep
gas usage predictable when performing manual allocations._

#### Parameters

| Name | Type    | Description                                      |
| ---- | ------- | ------------------------------------------------ |
| ptr  | uint256 | Previously saved free memory pointer to restore. |

### \_getRevertCode

```solidity
function _getRevertCode() internal pure returns (bytes32 revertCode)
```

Extracts a 32-byte revert code from returndata when present.

_If the current returndata is exactly 32 bytes long, this function
copies it to memory and returns it as a bytes32 value. Otherwise it
returns zero. Intended for AA-style error code handling where a
fixed-size error word is used._

#### Return Values

| Name       | Type    | Description                                                                                     |
| ---------- | ------- | ----------------------------------------------------------------------------------------------- |
| revertCode | bytes32 | Raw 32-byte revert code extracted from returndata, or zero if the size does not match 32 bytes. |

---

## IEntryPoint

Standard interface for an ERC-4337 style EntryPoint coordinating
user operations.

_Extends stake and nonce management and defines the core surface for
accounts, paymasters and bundlers. Implementations are expected to
enforce validation, prefund and gas accounting semantics defined by
the account abstraction specification._

### PostOpMode

Execution outcome for the post-operation callback flow.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
enum PostOpMode {
    unused,
    opSucceeded,
    opReverted,
    postOpReverted
}
```

### ReturnInfo

Aggregated return values from a single user operation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct ReturnInfo {
    uint256 preOpGas;
    uint256 prefund;
    uint256 accountValidationData;
    uint256 paymasterValidationData;
    bytes paymasterContext;
}
```

### MemoryUserOp

In-memory representation of a user operation used internally.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct MemoryUserOp {
    address sender;
    uint256 nonce;
    uint256 verificationGasLimit;
    uint256 callGasLimit;
    uint256 paymasterVerificationGasLimit;
    uint256 paymasterPostOpGasLimit;
    uint256 preVerificationGas;
    address paymaster;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
}
```

### UserOpInfo

Metadata derived during validation of a user operation.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct UserOpInfo {
  struct IEntryPoint.MemoryUserOp mUserOp;
  bytes32 userOpHash;
  uint256 prefund;
  uint256 contextOffset;
  uint256 preOpGas;
}
```

### UserOperationEvent

```solidity
event UserOperationEvent(bytes32 userOpHash, address sender, address paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)
```

Emitted after a user operation has been fully processed.

#### Parameters

| Name          | Type    | Description                                              |
| ------------- | ------- | -------------------------------------------------------- |
| userOpHash    | bytes32 | Hash of the user operation used for validation.          |
| sender        | address | Account that initiated the user operation.               |
| paymaster     | address | Paymaster that sponsored the operation, if any.          |
| nonce         | uint256 | Nonce used for replay protection on the sender account.  |
| success       | bool    | Indicates whether the call phase completed successfully. |
| actualGasCost | uint256 | Total gas cost charged to the sender or paymaster.       |
| actualGasUsed | uint256 | Total gas consumed for the entire operation.             |

### AccountDeployed

```solidity
event AccountDeployed(bytes32 userOpHash, address sender, address factory, address paymaster)
```

Emitted when an account is deployed as part of a user
operation.

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| userOpHash | bytes32 | Hash of the user operation that triggered deployment.    |
| sender     | address | Deployed account address acting as the operation sender. |
| factory    | address | Account factory contract that performed the deployment.  |
| paymaster  | address | Paymaster that sponsored the deployment, if any.         |

### UserOperationRevertReason

```solidity
event UserOperationRevertReason(bytes32 userOpHash, address sender, uint256 nonce, bytes revertReason)
```

Emitted when a user operation reverts with a reason string.

#### Parameters

| Name         | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| userOpHash   | bytes32 | Hash of the reverted user operation.               |
| sender       | address | Account that initiated the reverted operation.     |
| nonce        | uint256 | Nonce associated with the reverted operation.      |
| revertReason | bytes   | ABI-encoded revert reason returned from execution. |

### PostOpRevertReason

```solidity
event PostOpRevertReason(bytes32 userOpHash, address sender, uint256 nonce, bytes revertReason)
```

Emitted when a paymaster postOp execution reverts.

#### Parameters

| Name         | Type    | Description                                       |
| ------------ | ------- | ------------------------------------------------- |
| userOpHash   | bytes32 | Hash of the user operation whose postOp reverted. |
| sender       | address | Account that initiated the operation.             |
| nonce        | uint256 | Nonce associated with the user operation.         |
| revertReason | bytes   | ABI-encoded revert reason from the postOp call.   |

### UserOperationPrefundTooLow

```solidity
event UserOperationPrefundTooLow(bytes32 userOpHash, address sender, uint256 nonce)
```

Emitted when the prefund provided for a user operation is too
low.

#### Parameters

| Name       | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| userOpHash | bytes32 | Hash of the user operation with insufficient prefund. |
| sender     | address | Account that failed to pre-fund its operation.        |
| nonce      | uint256 | Nonce associated with the underfunded operation.      |

### BeforeExecution

```solidity
event BeforeExecution()
```

Emitted once before a batch of user operations is executed.

_Can be used by off-chain infrastructure to delimit execution
phases for logging and profiling._

### InvalidBeneficiary

```solidity
error InvalidBeneficiary(address beneficiary)
```

Thrown when the beneficiary address for collected fees
is invalid.

_Implementations typically use this when the beneficiary is the
zero address or otherwise not supported as a payout target._

#### Parameters

| Name        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| beneficiary | address | Address that was rejected as fee beneficiary. |

### FailedSendToBeneficiary

```solidity
error FailedSendToBeneficiary(address beneficiary)
```

Thrown when sending collected fees to the beneficiary fails.

_Indicates a low-level transfer failure while forwarding the
batch's collected gas fees._

#### Parameters

| Name        | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| beneficiary | address | Address that should have received the fees. |

### InternalCallOnly

```solidity
error InternalCallOnly()
```

Thrown when a function intended for internal use only is
called externally.

_Implementations use this to enforce that certain entry points
are reachable only via internal calls (for example, via
delegatecall or self-call patterns)._

### FailedOp

```solidity
error FailedOp(uint256 opIndex, bytes32 reason)
```

Thrown when processing a specific operation in a batch fails.

_The EntryPoint reverts the whole handleOps call but indicates
which index failed and with which high-level error code. The
`reason` parameter is a fixed-size AA error code hash
(for example, one of the predefined AAxx constants)._

#### Parameters

| Name    | Type    | Description                                           |
| ------- | ------- | ----------------------------------------------------- |
| opIndex | uint256 | Index of the failing operation within the batch.      |
| reason  | bytes32 | Fixed-size AA error code hash describing the failure. |

### FailedOpWithRevert

```solidity
error FailedOpWithRevert(uint256 opIndex, bytes32 reason, bytes inner)
```

Thrown when an operation fails and an inner revert payload is
preserved.

_Similar to FailedOp but also carries the underlying revert data
from the failing call for off-chain diagnosis. The `reason`
field is a fixed-size AA error code hash._

#### Parameters

| Name    | Type    | Description                                           |
| ------- | ------- | ----------------------------------------------------- |
| opIndex | uint256 | Index of the failing operation within the batch.      |
| reason  | bytes32 | Fixed-size AA error code hash describing the failure. |
| inner   | bytes   | ABI-encoded revert data from the inner failing call.  |

### handleOps

```solidity
function handleOps(struct PackedUserOperation[] ops, address payable beneficiary) external
```

Processes a batch of user operations.

_Bundlers call this entry point to validate, execute and settle a
batch of operations. Implementations are expected to: - Validate each operation's account and optional paymaster. - Perform deterministic gas accounting and prefund checks. - Execute the call for each valid operation. - Charge the sender or paymaster for actual gas used. - Emit UserOperationEvent per operation and relevant error
events.
May revert with FailedOp or FailedOpWithRevert if a specific
index fails irrecoverably._

#### Parameters

| Name        | Type                         | Description                                                             |
| ----------- | ---------------------------- | ----------------------------------------------------------------------- |
| ops         | struct PackedUserOperation[] | Array of packed user operations to be processed.                        |
| beneficiary | address payable              | Address that receives the collected fees for gas consumed by the batch. |

### getUserOpHash

```solidity
function getUserOpHash(struct PackedUserOperation userOp) external view returns (bytes32)
```

Computes the hash for a given user operation.

_Implementations typically use an EIP-712 style domain separator
and deterministic packing of the user operation fields. The
resulting hash is used for account or aggregator signature
validation._

#### Parameters

| Name   | Type                       | Description                                   |
| ------ | -------------------------- | --------------------------------------------- |
| userOp | struct PackedUserOperation | Packed user operation structure to be hashed. |

#### Return Values

| Name | Type    | Description                                                    |
| ---- | ------- | -------------------------------------------------------------- |
| [0]  | bytes32 | bytes32 Hash of the user operation for signature verification. |
