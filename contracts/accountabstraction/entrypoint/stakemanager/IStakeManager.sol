/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Stake manager interface
 * @notice Defines the staking and deposit interface used by the EntryPoint
 *         to secure actors and hold prefunded balances.
 * @dev Implementations manage per-account deposits and stake, including
 *      lock-up periods, withdrawals and associated events and errors.
 * @author ISBE Development Team
 */
interface IStakeManager {
    /**
     * @notice Complete deposit and stake state for an account.
     * @param deposit Total deposit balance held for this account.
     * @param staked True if this account currently has an active stake.
     * @param stake Actual amount of Ether locked as stake.
     * @param unstakeDelaySec Minimum delay in seconds before stake can be
     *        withdrawn after unlocking.
     * @param withdrawTime First block timestamp at which `withdrawStake`
     *        may be called, or zero if the stake is still locked.
     */
    struct DepositInfo {
        uint256 deposit;
        bool staked;
        uint112 stake;
        uint32 unstakeDelaySec;
        uint48 withdrawTime;
    }

    /**
     * @notice Stake parameters for an account.
     * @param stake Actual amount of Ether locked as stake.
     * @param unstakeDelaySec Minimum delay in seconds before stake may be
     *        withdrawn after it is unlocked.
     */
    struct StakeInfo {
        uint256 stake;
        uint256 unstakeDelaySec;
    }

    /**
     * @notice Emitted when an account's deposit balance increases.
     * @param account Account whose deposit has been increased.
     * @param totalDeposit New total deposit balance after the increase.
     */
    event Deposited(address indexed account, uint256 totalDeposit);

    /**
     * @notice Emitted when an account's deposit balance decreases.
     * @param account Account whose deposit has been reduced.
     * @param withdrawAddress Address that received the withdrawn amount.
     * @param amount Amount of Ether withdrawn from the deposit.
     */
    event Withdrawn(
        address indexed account,
        address withdrawAddress,
        uint256 amount
    );

    /**
     * @notice Emitted when stake amount or unstake delay are modified.
     * @param account Account whose stake settings have changed.
     * @param totalStaked New total staked amount for the account.
     * @param unstakeDelaySec Updated minimum unstake delay in seconds.
     */
    event StakeLocked(
        address indexed account,
        uint256 totalStaked,
        uint256 unstakeDelaySec
    );

    /**
     * @notice Emitted when stake is placed into the unstaking state.
     * @param account Account whose stake has been scheduled for withdrawal.
     * @param withdrawTime Timestamp from which `withdrawStake` may be called.
     */
    event StakeUnlocked(address indexed account, uint256 withdrawTime);

    /**
     * @notice Emitted when a staked amount is withdrawn.
     * @param account Account whose stake has been withdrawn.
     * @param withdrawAddress Address that received the withdrawn stake.
     * @param amount Amount of Ether withdrawn from the stake.
     */
    event StakeWithdrawn(
        address indexed account,
        address withdrawAddress,
        uint256 amount
    );

    /**
     * @notice Thrown when an unstake delay is required but not provided.
     * @dev Typically raised if `addStake` is called with a zero
     *      `unstakeDelaySec` value.
     */
    error NoUnstakeDelaySpecified();

    /**
     * @notice Thrown when attempting to reduce the existing unstake delay.
     * @dev Implementations must only allow increasing or keeping the same
     *      delay, never shortening it.
     * @param oldStakeTime Previously configured unstake delay in seconds.
     * @param newStakeTime Proposed new unstake delay in seconds.
     */
    error CannotDecreaseStakeTime(uint32 oldStakeTime, uint32 newStakeTime);

    /**
     * @notice Thrown when a non-zero stake value is required but not sent.
     * @dev Raised when stake-related calls do not include sufficient Ether.
     */
    error NoStakeSpecified();

    /**
     * @notice Thrown when the new stake value would overflow internal
     *         accounting.
     * @dev Implementations should validate stake additions to avoid
     *      exceeding supported numeric ranges.
     * @param stake Stake value that would cause the overflow.
     */
    error StakeOverflow(uint256 stake);

    /**
     * @notice Thrown when an operation requires an active stake but none
     *         is present.
     * @dev Typically raised when trying to unlock or withdraw without
     *      having a staked position.
     */
    error NoActiveStake();

    /**
     * @notice Thrown when an account is already in the unstaking process.
     * @dev Prevents re-entering the unlock flow before the previous
     *      unstake period has completed.
     */
    error AlreadyInUnstaking();

    /**
     * @notice Thrown when there is no stake available to withdraw.
     * @dev Indicates that withdrawStake is being called with zero
     *      withdrawable stake.
     */
    error NoStakeToWithdraw();

    /**
     * @notice Thrown when stake withdrawal is attempted without unlocking
     *         first.
     * @dev Enforces the requirement that `unlockStake` must be called
     *      before `withdrawStake`.
     */
    error MustUnlockFirst();

    /**
     * @notice Thrown when stake withdrawal is attempted before the
     *         withdraw time is due.
     * @dev Ensures the configured unstake delay has fully elapsed.
     * @param withdrawTime Timestamp from which withdrawal becomes allowed.
     */
    error StakeWithdrawalNotDue(uint256 withdrawTime);

    /**
     * @notice Thrown when transferring the withdrawn stake fails.
     * @dev Indicates a low-level transfer failure in `withdrawStake`.
     */
    error WithdrawStakeFailed();

    /**
     * @notice Thrown when a requested withdrawal amount exceeds the
     *         available deposit.
     * @dev Used in `withdrawTo` to enforce balance limits.
     * @param amount Requested withdrawal amount that was too large.
     */
    error WithdrawAmountTooLarge(uint256 amount);

    /**
     * @notice Thrown when transferring withdrawn deposit funds fails.
     * @dev Indicates a low-level transfer failure in `withdrawTo`.
     */
    error WithdrawFailed();

    /**
     * @notice Increments the deposit balance of a given account.
     * @dev Accepts Ether and credits it to `account` as deposit. The
     *      implementation should emit `Deposited` with the new total
     *      deposit amount.
     * @param account Address whose deposit balance is increased.
     */
    function depositTo(address account) external payable;

    /**
     * @notice Adds or increases the stake for the calling account.
     * @dev Requires a non-zero `unstakeDelaySec` and must not reduce an
     *      existing delay. The Ether sent with the call is treated as
     *      additional stake. Should emit `StakeLocked` on success.
     * @param unstakeDelaySec Required delay in seconds before stake
     *        withdrawal after unlocking.
     */
    function addStake(uint32 unstakeDelaySec) external payable;

    /**
     * @notice Initiates the unstaking process for the calling account.
     * @dev Marks the current stake as pending withdrawal and sets a
     *      future `withdrawTime`. Should emit `StakeUnlocked`.
     */
    function unlockStake() external;

    /**
     * @notice Withdraws the caller's staked Ether once the unstake delay
     *         has passed.
     * @dev Transfers the entire unlocked stake to `withdrawAddress` and
     *      resets stake-related data. Should emit `StakeWithdrawn` on
     *      success.
     * @param withdrawAddress Destination address receiving the withdrawn
     *        stake.
     */
    function withdrawStake(address payable withdrawAddress) external;

    /**
     * @notice Withdraws a specific amount from the caller's deposit
     *         balance.
     * @dev Transfers `withdrawAmount` from the deposit to
     *      `withdrawAddress` and updates the stored deposit. Should emit
     *      `Withdrawn` on success.
     * @param withdrawAddress Destination address receiving the withdrawn
     *        funds.
     * @param withdrawAmount Amount in wei to withdraw from the deposit
     *        balance.
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 withdrawAmount
    ) external;

    /**
     * @notice Retrieves the complete deposit and stake information for an
     *         account.
     * @dev Returns a `DepositInfo` struct containing both deposit and
     *      stake-related fields for `account`.
     * @param account Address of the account being queried.
     * @return info `DepositInfo` structure with deposit and stake details.
     */
    function getDepositInfo(
        address account
    ) external view returns (DepositInfo memory info);

    /**
     * @notice Retrieves the deposit balance of an account.
     * @dev Returns the Ether amount currently held as a deposit for the
     *      given address.
     * @param account Address of the depositor.
     * @return nonce Deposit balance in wei for `account`.
     */
    function balanceOf(address account) external view returns (uint256 nonce);
}
