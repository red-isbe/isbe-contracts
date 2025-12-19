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

import {DidDocumentDetailedInternal} from '../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {_ACCOUNT_ABSTRACTION_STAKE_MANAGER_STORAGE_POSITION} from '../../../constants/storagePositions.sol';
import './IStakeManager.sol';

/**
 * @title StakeManagerInternal
 * @notice Provides internal staking and deposit management logic for accounts and paymasters.
 * @dev Handles deposit balances, staking, unstaking, and withdrawal mechanisms. Intended
 *      for use by higher-level contracts such as EntryPoint or DID-based account managers.
 *      This contract does not expose external methods; all operations are performed internally.
 * @author ISBE Development Team
 */
abstract contract StakeManagerInternal is DidDocumentDetailedInternal {
    struct StakeManagerStorage {
        /**
         * @notice Maps each address to its corresponding deposit and staking information.
         * @dev The mapping stores `IStakeManager.DepositInfo`, which contains deposit amount,
         *      staking status, stake amount, unstake delay, and withdrawal time. Each address
         *      maintains its own independent staking record.
         */
        mapping(address => IStakeManager.DepositInfo) deposits;
    }

    /**
     * @notice Adds or increases the stake for the calling account.
     * @dev Requires a non-zero unstake delay and prevents decreasing an existing delay.
     *      Updates stake information and accepts Ether sent with the call as stake.
     * @param unstakeDelaySec The required delay (in seconds) before stake withdrawal.
     * @return uint256 The updated total staked amount after addition.
     *
     * Requirements:
     * - `unstakeDelaySec` must be greater than zero.
     * - Cannot reduce the existing unstake delay period.
     * - The stake amount must fit within 112 bits.
     * - `msg.value` must be greater than zero.
     */
    function _addStake(uint32 unstakeDelaySec) internal returns (uint256) {
        IStakeManager.DepositInfo storage info = _stakeManagerStorage()
            .deposits[_msgSender()];
        require(unstakeDelaySec > 0, IStakeManager.NoUnstakeDelaySpecified());
        require(
            unstakeDelaySec >= info.unstakeDelaySec,
            IStakeManager.CannotDecreaseStakeTime(
                info.unstakeDelaySec,
                unstakeDelaySec
            )
        );
        uint256 stake = info.stake + msg.value;
        require(stake > 0, IStakeManager.NoStakeSpecified());
        require(stake <= type(uint112).max, IStakeManager.StakeOverflow(stake));
        _stakeManagerStorage().deposits[_msgSender()] = IStakeManager
            .DepositInfo(
                info.deposit,
                true,
                uint112(stake),
                unstakeDelaySec,
                0
            );
        return stake;
    }

    /**
     * @notice Initiates the unstaking process for the calling account.
     * @dev Marks the stake as pending withdrawal and sets the withdrawal timestamp.
     * @return uint48 The timestamp (in seconds) after which the stake can be withdrawn.
     *
     * Requirements:
     * - Account must currently have an active stake.
     * - The stake must not already be in the process of unstaking.
     */
    function _unlockStake() internal returns (uint48) {
        IStakeManager.DepositInfo storage info = _stakeManagerStorage()
            .deposits[_msgSender()];
        require(info.unstakeDelaySec != 0, IStakeManager.NoActiveStake());
        require(info.staked, IStakeManager.AlreadyInUnstaking());
        uint48 withdrawTime = uint48(block.timestamp) + info.unstakeDelaySec;
        info.withdrawTime = withdrawTime;
        info.staked = false;
        return withdrawTime;
    }

    /**
     * @notice Withdraws the caller’s staked Ether once the unstake delay has passed.
     * @dev Transfers the entire stake amount to the specified address and resets stake data.
     * @param withdrawAddress Destination address receiving the withdrawn stake.
     * @return uint256 The withdrawn stake amount in wei.
     *
     * Requirements:
     * - The caller must have previously initiated `_unlockStake()`.
     * - The current time must be greater than or equal to `withdrawTime`.
     * - The transfer to `withdrawAddress` must succeed.
     */
    function _withdrawStake(
        address payable withdrawAddress
    ) internal returns (uint256) {
        IStakeManager.DepositInfo storage info = _stakeManagerStorage()
            .deposits[_msgSender()];
        uint256 stake = info.stake;
        require(stake > 0, IStakeManager.NoStakeToWithdraw());
        require(info.withdrawTime > 0, IStakeManager.MustUnlockFirst());
        require(
            info.withdrawTime <= block.timestamp,
            IStakeManager.StakeWithdrawalNotDue(info.withdrawTime)
        );
        info.unstakeDelaySec = 0;
        info.withdrawTime = 0;
        info.stake = 0;
        (bool success, ) = withdrawAddress.call{value: stake}('');
        require(success, IStakeManager.WithdrawStakeFailed());
        return stake;
    }

    /**
     * @notice Withdraws a specific amount from the caller’s deposit balance.
     * @dev Transfers the requested amount to the provided address and updates deposit record.
     * @param withdrawAddress Destination address receiving the withdrawn funds.
     * @param withdrawAmount Amount (in wei) to withdraw from the deposit balance.
     *
     * Requirements:
     * - `withdrawAmount` must not exceed the caller’s deposit balance.
     * - The transfer to `withdrawAddress` must succeed.
     */
    function _withdrawTo(
        address payable withdrawAddress,
        uint256 withdrawAmount
    ) internal {
        IStakeManager.DepositInfo storage info = _stakeManagerStorage()
            .deposits[_msgSender()];
        uint256 currentDeposit = info.deposit;
        require(
            withdrawAmount <= currentDeposit,
            IStakeManager.WithdrawAmountTooLarge(withdrawAmount)
        );
        info.deposit = currentDeposit - withdrawAmount;
        (bool success, ) = withdrawAddress.call{value: withdrawAmount}('');
        require(success, IStakeManager.WithdrawFailed());
    }

    /**
     * @notice Increments the deposit balance of a given account.
     * @dev Updates and returns the new total deposit amount after adding the specified value.
     * @param account Address whose deposit balance is increased.
     * @param amount Amount of Ether (in wei) to add to the deposit.
     * @return uint256 The updated deposit amount after increment.
     */
    function _incrementDeposit(
        address account,
        uint256 amount
    ) internal returns (uint256) {
        unchecked {
            IStakeManager.DepositInfo storage info = _stakeManagerStorage()
                .deposits[account];
            uint256 newAmount = info.deposit + amount;
            info.deposit = newAmount;
            return newAmount;
        }
    }

    /**
     * @notice Attempts to deduct a specified amount from an account’s deposit.
     * @dev Returns `false` if the account’s deposit balance is insufficient.
     * @param account Address whose deposit balance will be reduced.
     * @param amount Amount (in wei) to attempt to deduct.
     * @return bool True if deduction succeeded; false if insufficient funds.
     */
    function _tryDecrementDeposit(
        address account,
        uint256 amount
    ) internal returns (bool) {
        unchecked {
            IStakeManager.DepositInfo storage info = _stakeManagerStorage()
                .deposits[account];
            uint256 currentDeposit = info.deposit;
            if (currentDeposit < amount) {
                return false;
            }
            info.deposit = currentDeposit - amount;
            return true;
        }
    }

    /**
     * @notice Retrieves the complete deposit information for an account.
     * @dev Returns a `DepositInfo` struct containing all deposit and stake data.
     * @param account Address of the account whose deposit information is queried.
     * @return info The `DepositInfo` structure containing deposit and stake details.
     */
    function _getDepositInfo(
        address account
    ) internal view returns (IStakeManager.DepositInfo memory info) {
        return _stakeManagerStorage().deposits[account];
    }

    /**
     * @notice Retrieves the deposit balance of an account.
     * @dev Returns the Ether amount currently held as a deposit by the given address.
     * @param account Address of the depositor.
     * @return uint256 Deposit balance in wei.
     */
    function _balanceOf(address account) internal view returns (uint256) {
        return _stakeManagerStorage().deposits[account].deposit;
    }

    /** @notice Returns the storage slot for stake manager
     * @dev Uses inline assembly to return storage struct at predefined slot
     * @return storage_ The stake manager storage struct
     */
    function _stakeManagerStorage()
        internal
        pure
        returns (StakeManagerStorage storage storage_)
    {
        bytes32 position = _ACCOUNT_ABSTRACTION_STAKE_MANAGER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
