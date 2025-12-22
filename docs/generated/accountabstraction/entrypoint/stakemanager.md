## IStakeManager

Defines the staking and deposit interface used by the EntryPoint
to secure actors and hold prefunded balances.

_Implementations manage per-account deposits and stake, including
lock-up periods, withdrawals and associated events and errors._

### DepositInfo

Complete deposit and stake state for an account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct DepositInfo {
    uint256 deposit;
    bool staked;
    uint112 stake;
    uint32 unstakeDelaySec;
    uint48 withdrawTime;
}
```

### StakeInfo

Stake parameters for an account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct StakeInfo {
    uint256 stake;
    uint256 unstakeDelaySec;
}
```

### Deposited

```solidity
event Deposited(address account, uint256 totalDeposit)
```

Emitted when an account's deposit balance increases.

#### Parameters

| Name         | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| account      | address | Account whose deposit has been increased.     |
| totalDeposit | uint256 | New total deposit balance after the increase. |

### Withdrawn

```solidity
event Withdrawn(address account, address withdrawAddress, uint256 amount)
```

Emitted when an account's deposit balance decreases.

#### Parameters

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| account         | address | Account whose deposit has been reduced.     |
| withdrawAddress | address | Address that received the withdrawn amount. |
| amount          | uint256 | Amount of Ether withdrawn from the deposit. |

### StakeLocked

```solidity
event StakeLocked(address account, uint256 totalStaked, uint256 unstakeDelaySec)
```

Emitted when stake amount or unstake delay are modified.

#### Parameters

| Name            | Type    | Description                                |
| --------------- | ------- | ------------------------------------------ |
| account         | address | Account whose stake settings have changed. |
| totalStaked     | uint256 | New total staked amount for the account.   |
| unstakeDelaySec | uint256 | Updated minimum unstake delay in seconds.  |

### StakeUnlocked

```solidity
event StakeUnlocked(address account, uint256 withdrawTime)
```

Emitted when stake is placed into the unstaking state.

#### Parameters

| Name         | Type    | Description                                            |
| ------------ | ------- | ------------------------------------------------------ |
| account      | address | Account whose stake has been scheduled for withdrawal. |
| withdrawTime | uint256 | Timestamp from which `withdrawStake` may be called.    |

### StakeWithdrawn

```solidity
event StakeWithdrawn(address account, address withdrawAddress, uint256 amount)
```

Emitted when a staked amount is withdrawn.

#### Parameters

| Name            | Type    | Description                                |
| --------------- | ------- | ------------------------------------------ |
| account         | address | Account whose stake has been withdrawn.    |
| withdrawAddress | address | Address that received the withdrawn stake. |
| amount          | uint256 | Amount of Ether withdrawn from the stake.  |

### NoUnstakeDelaySpecified

```solidity
error NoUnstakeDelaySpecified()
```

Thrown when an unstake delay is required but not provided.

_Typically raised if `addStake` is called with a zero
`unstakeDelaySec` value._

### CannotDecreaseStakeTime

```solidity
error CannotDecreaseStakeTime(uint32 oldStakeTime, uint32 newStakeTime)
```

Thrown when attempting to reduce the existing unstake delay.

_Implementations must only allow increasing or keeping the same
delay, never shortening it._

#### Parameters

| Name         | Type   | Description                                     |
| ------------ | ------ | ----------------------------------------------- |
| oldStakeTime | uint32 | Previously configured unstake delay in seconds. |
| newStakeTime | uint32 | Proposed new unstake delay in seconds.          |

### NoStakeSpecified

```solidity
error NoStakeSpecified()
```

Thrown when a non-zero stake value is required but not sent.

_Raised when stake-related calls do not include sufficient Ether._

### StakeOverflow

```solidity
error StakeOverflow(uint256 stake)
```

Thrown when the new stake value would overflow internal
accounting.

_Implementations should validate stake additions to avoid
exceeding supported numeric ranges._

#### Parameters

| Name  | Type    | Description                                |
| ----- | ------- | ------------------------------------------ |
| stake | uint256 | Stake value that would cause the overflow. |

### NoActiveStake

```solidity
error NoActiveStake()
```

Thrown when an operation requires an active stake but none
is present.

_Typically raised when trying to unlock or withdraw without
having a staked position._

### AlreadyInUnstaking

```solidity
error AlreadyInUnstaking()
```

Thrown when an account is already in the unstaking process.

_Prevents re-entering the unlock flow before the previous
unstake period has completed._

### NoStakeToWithdraw

```solidity
error NoStakeToWithdraw()
```

Thrown when there is no stake available to withdraw.

_Indicates that withdrawStake is being called with zero
withdrawable stake._

### MustUnlockFirst

```solidity
error MustUnlockFirst()
```

Thrown when stake withdrawal is attempted without unlocking
first.

_Enforces the requirement that `unlockStake` must be called
before `withdrawStake`._

### StakeWithdrawalNotDue

```solidity
error StakeWithdrawalNotDue(uint256 withdrawTime)
```

Thrown when stake withdrawal is attempted before the
withdraw time is due.

_Ensures the configured unstake delay has fully elapsed._

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| withdrawTime | uint256 | Timestamp from which withdrawal becomes allowed. |

### WithdrawStakeFailed

```solidity
error WithdrawStakeFailed()
```

Thrown when transferring the withdrawn stake fails.

_Indicates a low-level transfer failure in `withdrawStake`._

### WithdrawAmountTooLarge

```solidity
error WithdrawAmountTooLarge(uint256 amount)
```

Thrown when a requested withdrawal amount exceeds the
available deposit.

_Used in `withdrawTo` to enforce balance limits._

#### Parameters

| Name   | Type    | Description                                     |
| ------ | ------- | ----------------------------------------------- |
| amount | uint256 | Requested withdrawal amount that was too large. |

### WithdrawFailed

```solidity
error WithdrawFailed()
```

Thrown when transferring withdrawn deposit funds fails.

_Indicates a low-level transfer failure in `withdrawTo`._

### depositTo

```solidity
function depositTo(address account) external payable
```

Increments the deposit balance of a given account.

_Accepts Ether and credits it to `account` as deposit. The
implementation should emit `Deposited` with the new total
deposit amount._

#### Parameters

| Name    | Type    | Description                                 |
| ------- | ------- | ------------------------------------------- |
| account | address | Address whose deposit balance is increased. |

### addStake

```solidity
function addStake(uint32 unstakeDelaySec) external payable
```

Adds or increases the stake for the calling account.

_Requires a non-zero `unstakeDelaySec` and must not reduce an
existing delay. The Ether sent with the call is treated as
additional stake. Should emit `StakeLocked` on success._

#### Parameters

| Name            | Type   | Description                                                        |
| --------------- | ------ | ------------------------------------------------------------------ |
| unstakeDelaySec | uint32 | Required delay in seconds before stake withdrawal after unlocking. |

### unlockStake

```solidity
function unlockStake() external
```

Initiates the unstaking process for the calling account.

_Marks the current stake as pending withdrawal and sets a
future `withdrawTime`. Should emit `StakeUnlocked`._

### withdrawStake

```solidity
function withdrawStake(address payable withdrawAddress) external
```

Withdraws the caller's staked Ether once the unstake delay
has passed.

_Transfers the entire unlocked stake to `withdrawAddress` and
resets stake-related data. Should emit `StakeWithdrawn` on
success._

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

_Transfers `withdrawAmount` from the deposit to
`withdrawAddress` and updates the stored deposit. Should emit
`Withdrawn` on success._

#### Parameters

| Name            | Type            | Description                                         |
| --------------- | --------------- | --------------------------------------------------- |
| withdrawAddress | address payable | Destination address receiving the withdrawn funds.  |
| withdrawAmount  | uint256         | Amount in wei to withdraw from the deposit balance. |

### getDepositInfo

```solidity
function getDepositInfo(address account) external view returns (struct IStakeManager.DepositInfo info)
```

Retrieves the complete deposit and stake information for an
account.

_Returns a `DepositInfo` struct containing both deposit and
stake-related fields for `account`._

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
function balanceOf(address account) external view returns (uint256 nonce)
```

Retrieves the deposit balance of an account.

_Returns the Ether amount currently held as a deposit for the
given address._

#### Parameters

| Name    | Type    | Description               |
| ------- | ------- | ------------------------- |
| account | address | Address of the depositor. |

#### Return Values

| Name  | Type    | Description                           |
| ----- | ------- | ------------------------------------- |
| nonce | uint256 | Deposit balance in wei for `account`. |

---

## StakeManagerInternal

Provides internal staking and deposit management logic for accounts and paymasters.

_Handles deposit balances, staking, unstaking, and withdrawal mechanisms. Intended
for use by higher-level contracts such as EntryPoint or DID-based account managers.
This contract does not expose external methods; all operations are performed internally._

### StakeManagerStorage

```solidity
struct StakeManagerStorage {
  mapping(address => struct IStakeManager.DepositInfo) deposits;
}
```

### \_addStake

```solidity
function _addStake(uint32 unstakeDelaySec) internal returns (uint256)
```

Adds or increases the stake for the calling account.

_Requires a non-zero unstake delay and prevents decreasing an existing delay.
Updates stake information and accepts Ether sent with the call as stake._

#### Parameters

| Name            | Type   | Description                                              |
| --------------- | ------ | -------------------------------------------------------- |
| unstakeDelaySec | uint32 | The required delay (in seconds) before stake withdrawal. |

#### Return Values

| Name | Type    | Description                                                                                                                                                                                                                                                   |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 The updated total staked amount after addition. Requirements: - `unstakeDelaySec` must be greater than zero. - Cannot reduce the existing unstake delay period. - The stake amount must fit within 112 bits. - `msg.value` must be greater than zero. |

### \_unlockStake

```solidity
function _unlockStake() internal returns (uint48)
```

Initiates the unstaking process for the calling account.

_Marks the stake as pending withdrawal and sets the withdrawal timestamp._

#### Return Values

| Name | Type   | Description                                                                                                                                                                                         |
| ---- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | uint48 | uint48 The timestamp (in seconds) after which the stake can be withdrawn. Requirements: - Account must currently have an active stake. - The stake must not already be in the process of unstaking. |

### \_withdrawStake

```solidity
function _withdrawStake(address payable withdrawAddress) internal returns (uint256)
```

Withdraws the caller’s staked Ether once the unstake delay has passed.

_Transfers the entire stake amount to the specified address and resets stake data._

#### Parameters

| Name            | Type            | Description                                        |
| --------------- | --------------- | -------------------------------------------------- |
| withdrawAddress | address payable | Destination address receiving the withdrawn stake. |

#### Return Values

| Name | Type    | Description                                                                                                                                                                                                                                  |
| ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0]  | uint256 | uint256 The withdrawn stake amount in wei. Requirements: - The caller must have previously initiated `_unlockStake()`. - The current time must be greater than or equal to `withdrawTime`. - The transfer to `withdrawAddress` must succeed. |

### \_withdrawTo

```solidity
function _withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) internal
```

Withdraws a specific amount from the caller’s deposit balance.

_Transfers the requested amount to the provided address and updates deposit record._

#### Parameters

| Name            | Type            | Description                                                                                                                                                                            |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| withdrawAddress | address payable | Destination address receiving the withdrawn funds.                                                                                                                                     |
| withdrawAmount  | uint256         | Amount (in wei) to withdraw from the deposit balance. Requirements: - `withdrawAmount` must not exceed the caller’s deposit balance. - The transfer to `withdrawAddress` must succeed. |

### \_incrementDeposit

```solidity
function _incrementDeposit(address account, uint256 amount) internal returns (uint256)
```

Increments the deposit balance of a given account.

_Updates and returns the new total deposit amount after adding the specified value._

#### Parameters

| Name    | Type    | Description                                     |
| ------- | ------- | ----------------------------------------------- |
| account | address | Address whose deposit balance is increased.     |
| amount  | uint256 | Amount of Ether (in wei) to add to the deposit. |

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | uint256 | uint256 The updated deposit amount after increment. |

### \_tryDecrementDeposit

```solidity
function _tryDecrementDeposit(address account, uint256 amount) internal returns (bool)
```

Attempts to deduct a specified amount from an account’s deposit.

_Returns `false` if the account’s deposit balance is insufficient._

#### Parameters

| Name    | Type    | Description                                    |
| ------- | ------- | ---------------------------------------------- |
| account | address | Address whose deposit balance will be reduced. |
| amount  | uint256 | Amount (in wei) to attempt to deduct.          |

#### Return Values

| Name | Type | Description                                                    |
| ---- | ---- | -------------------------------------------------------------- |
| [0]  | bool | bool True if deduction succeeded; false if insufficient funds. |

### \_getDepositInfo

```solidity
function _getDepositInfo(address account) internal view returns (struct IStakeManager.DepositInfo info)
```

Retrieves the complete deposit information for an account.

_Returns a `DepositInfo` struct containing all deposit and stake data._

#### Parameters

| Name    | Type    | Description                                                  |
| ------- | ------- | ------------------------------------------------------------ |
| account | address | Address of the account whose deposit information is queried. |

#### Return Values

| Name | Type                             | Description                                                       |
| ---- | -------------------------------- | ----------------------------------------------------------------- |
| info | struct IStakeManager.DepositInfo | The `DepositInfo` structure containing deposit and stake details. |

### \_balanceOf

```solidity
function _balanceOf(address account) internal view returns (uint256)
```

Retrieves the deposit balance of an account.

_Returns the Ether amount currently held as a deposit by the given address._

#### Parameters

| Name    | Type    | Description               |
| ------- | ------- | ------------------------- |
| account | address | Address of the depositor. |

#### Return Values

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| [0]  | uint256 | uint256 Deposit balance in wei. |

### \_stakeManagerStorage

```solidity
function _stakeManagerStorage() internal pure returns (struct StakeManagerInternal.StakeManagerStorage storage_)
```

Returns the storage slot for stake manager

_Uses inline assembly to return storage struct at predefined slot_

#### Return Values

| Name      | Type                                            | Description                      |
| --------- | ----------------------------------------------- | -------------------------------- |
| storage\_ | struct StakeManagerInternal.StakeManagerStorage | The stake manager storage struct |
