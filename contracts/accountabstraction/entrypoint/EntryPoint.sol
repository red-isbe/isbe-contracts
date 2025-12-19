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

import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {IEntryPoint} from './IEntryPoint.sol';
import {EntryPointInternal} from './EntryPointInternal.sol';
import {INonceManager} from './noncemanager/INonceManager.sol';
import {IStakeManager} from './stakemanager/IStakeManager.sol';
import {ERC165} from '../../core/ERC165.sol';
import {ReentrancyGuard} from '../../security/ReentrancyGuard.sol';

/**
 * @title Account abstraction EntryPoint implementation
 * @notice Concrete ERC-4337 style EntryPoint exposing the public interface for
 *         user operations, staking and nonce management.
 * @dev Bridges the external IEntryPoint, IStakeManager and INonceManager
 *      interfaces with the internal logic implemented in EntryPointInternal.
 *      Integrates ERC165 introspection and a re-entrancy guard. Designed to be
 *      used as a facet / module in an upgradeable, resolver-based system.
 * @author ISBE Development Team
 */
abstract contract EntryPoint is
    EntryPointInternal,
    IEntryPoint,
    ERC165,
    ReentrancyGuard
{
    /**
     * @inheritdoc IStakeManager
     * @dev Accepts Ether and increments the internal deposit for `account`.
     *      Emits `Deposited` with the new deposit amount. Pausable via
     *      `whenNotPaused`.
     */
    function depositTo(
        address account
    ) external payable virtual override whenNotPaused {
        uint256 newDeposit = _incrementDeposit(account, msg.value);
        emit Deposited(account, newDeposit);
    }

    /**
     * @inheritdoc IStakeManager
     * @dev Locks additional stake for the caller with the specified unstake
     *      delay. Emits `StakeLocked`. Pausable via `whenNotPaused`.
     */
    function addStake(
        uint32 unstakeDelaySec
    ) external payable override whenNotPaused {
        uint256 stake = _addStake(unstakeDelaySec);
        emit StakeLocked(_msgSender(), stake, unstakeDelaySec);
    }

    /**
     * @inheritdoc IEntryPoint
     * @dev Protected by `whenNotPaused` and `nonReentrant("handleops")` to
     *      prevent concurrent re-entry into batch processing.
     */
    function handleOps(
        PackedUserOperation[] calldata ops,
        address payable beneficiary
    ) external override whenNotPaused nonReentrant('handleops') {
        _handleOps(ops, beneficiary);
    }

    /**
     * @inheritdoc INonceManager
     * @dev Increments the caller's nonce for the given key. Used for manual
     *      nonce management outside of user operations.
     */
    function incrementNonce(uint192 key) external override {
        return _incrementNonce(key);
    }

    /**
     * @inheritdoc IStakeManager
     * @dev Starts the unstaking process for the caller. Emits
     *      `StakeUnlocked` with the timestamp after which stake can be
     *      withdrawn. Pausable via `whenNotPaused`.
     */
    function unlockStake() external override whenNotPaused {
        uint48 withdrawTime = _unlockStake();
        emit StakeUnlocked(_msgSender(), withdrawTime);
    }

    /**
     * @inheritdoc IStakeManager
     * @dev Withdraws the caller's unlocked stake to `withdrawAddress`. Emits
     *      `StakeWithdrawn`. Pausable via `whenNotPaused`.
     */
    function withdrawStake(
        address payable withdrawAddress
    ) external override whenNotPaused {
        uint256 stake = _withdrawStake(withdrawAddress);
        emit StakeWithdrawn(_msgSender(), withdrawAddress, stake);
    }

    /**
     * @inheritdoc IStakeManager
     * @dev Withdraws `withdrawAmount` from the caller's deposit to
     *      `withdrawAddress`. Emits `Withdrawn`. Pausable via `whenNotPaused`.
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 withdrawAmount
    ) external override whenNotPaused {
        _withdrawTo(withdrawAddress, withdrawAmount);
        emit Withdrawn(_msgSender(), withdrawAddress, withdrawAmount);
    }

    /**
     * @inheritdoc INonceManager
     * @dev Returns the current nonce for the specified sender and key, as
     *      tracked by the internal nonce manager.
     */
    function getNonce(
        address sender,
        uint192 key
    ) external view override returns (uint256 nonce) {
        return _getNonce(sender, key);
    }

    /**
     * @inheritdoc IEntryPoint
     * @dev Forwards to the internal EIP-712-aware hash computation.
     */
    function getUserOpHash(
        PackedUserOperation calldata userOp
    ) external view override returns (bytes32) {
        return _getUserOpHash(userOp);
    }

    /**
     * @inheritdoc IStakeManager
     * @dev Reads deposit and stake details from the internal stake manager
     *      storage.
     */
    function getDepositInfo(
        address account
    ) external view override returns (DepositInfo memory info) {
        return _getDepositInfo(account);
    }

    /**
     * @inheritdoc IStakeManager
     * @dev Returns the current deposit balance held for the given account.
     */
    function balanceOf(
        address account
    ) external view override returns (uint256) {
        return _balanceOf(account);
    }

    /**
     * @notice Lists the interface identifiers implemented by this contract.
     * @dev Used by ERC165 to advertise support for IEntryPoint, IStakeManager
     *      and INonceManager. The returned array is consumed by the base
     *      ERC165 implementation.
     * @return interfaces_ Array of supported ERC165 interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](3);
        interfaces_[0] = type(IEntryPoint).interfaceId;
        interfaces_[1] = type(IStakeManager).interfaceId;
        interfaces_[2] = type(INonceManager).interfaceId;
    }
}
