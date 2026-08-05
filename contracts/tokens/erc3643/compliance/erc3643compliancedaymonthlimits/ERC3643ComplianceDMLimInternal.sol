// SPDX-License-Identifier: Apache-2.0

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
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {
    _ERC3643_COMPLIANCE_DMLIM_STORAGE_POSITION
} from '../../../../constants/storagePositions.sol';
import {
    DidDocumentDetailedInternal
} from '../../../../identity/didregistry/DidDocumentDetailedInternal.sol';
/**
 * @title ERC3643ComplianceDMLimInternal
 * @notice Internal contract for managing ERC-3643 daily/monthly transfer limits.
 * @dev Provides internal functions to read and write limit fields, check compliance, and update counters.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643ComplianceDMLimInternal is
    DidDocumentDetailedInternal
{
    /// @dev Storage structure for ERC-3643 daily/monthly limits.
    struct ERC3643ComplianceDMLimStorage {
        uint256 dailyLimit;
        uint256 monthlyLimit;
        mapping(address => TransferCounter) usersCounters;
    }

    /// @dev Struct of transfer counters for each address.
    struct TransferCounter {
        uint256 dailyCount;
        uint256 monthlyCount;
        uint256 dailyTimer;
        uint256 monthlyTimer;
    }

    /**
     * @dev Internal function to initialize daily/monthly limits in storage.
     * Sets the initial values for daily and monthly transfer limits.
     * @param _dailyLimit The initial daily transfer limit.
     * @param _monthlyLimit The initial monthly transfer limit.
     */
    function _initializeDMLim(
        uint256 _dailyLimit,
        uint256 _monthlyLimit
    ) internal {
        _setDailyLimit(_dailyLimit);
        _setMonthlyLimit(_monthlyLimit);
    }

    /**
     * @dev Internal function to update the daily limit value in storage.
     * @param _dailyLimit The new daily limit value to assign.
     */
    function _setDailyLimit(uint256 _dailyLimit) internal {
        _erc3643ComplianceDMLimStorage().dailyLimit = _dailyLimit;
    }

    /**
     * @dev Internal function to update the monthly limit value in storage.
     * @param _monthlyLimit The new monthly limit value to assign.
     */
    function _setMonthlyLimit(uint256 _monthlyLimit) internal {
        _erc3643ComplianceDMLimStorage().monthlyLimit = _monthlyLimit;
    }

    /**
     * @dev Internal hook for post-transfer operations for DayMonthLimits feature.
     *      Updates daily and monthly counters.
     *      Emits DayMonthLimitsTransferHook event.
     * @param _from The address of the sender.
     * @param _amount The amount of tokens transferred.
     */
    function _transferActionOnDayMonthLimits(
        address _from,
        uint256 _amount
    ) internal {
        TransferCounter storage transferCounter = _getTransferCounter(_from);

        // Reset timers if needed
        if (_isDayFinished(_from)) {
            transferCounter.dailyTimer = _blockTimestamp() + 1 days;
            transferCounter.dailyCount = 0;
        }
        if (_isMonthFinished(_from)) {
            transferCounter.monthlyTimer = _blockTimestamp() + 30 days;
            transferCounter.monthlyCount = 0;
        }

        // Update counters (los límites ya han sido validados en compliance)
        transferCounter.dailyCount += _amount;
        transferCounter.monthlyCount += _amount;
    }

    /**
     * @dev Internal view function to retrieve the current daily limit value from storage.
     * @return The current daily limit value.
     */
    function _getDailyLimit() internal view returns (uint256) {
        return _erc3643ComplianceDMLimStorage().dailyLimit;
    }

    /**
     * @dev Internal view function to retrieve the current monthly limit value from storage.
     * @return The current monthly limit value.
     */
    function _getMonthlyLimit() internal view returns (uint256) {
        return _erc3643ComplianceDMLimStorage().monthlyLimit;
    }

    /**
     * @dev Internal view function to get the transfer counters for a given address.
     * @param _account The address to query.
     * @return counter The TransferCounter struct for the address.
     */
    function _getTransferCounter(
        address _account
    ) internal view returns (TransferCounter storage counter) {
        return _erc3643ComplianceDMLimStorage().usersCounters[_account];
    }

    /**
     * @dev Internal view function to check if a transfer respects the daily/monthly limits.
     * @param _from The address of the sender.
     * @param _value The amount of tokens to transfer.
     * @return True if compliant, false otherwise.
     */
    function _complianceCheckOnDayMonthLimits(
        address _from,
        uint256 _value
    ) internal view returns (bool) {
        if (_from == address(0)) return true;

        uint256 _dailyLimit = _getDailyLimit();

        // If the value exceeds the daily limit, reject
        if (_value > _dailyLimit) {
            return false;
        }

        TransferCounter storage transferCounter = _getTransferCounter(_from);
        uint256 _monthlyLimit = _getMonthlyLimit();

        // If the day has not finished, check the daily and monthly counters
        if (
            !_isDayFinished(_from) &&
            ((transferCounter.dailyCount + _value > _dailyLimit) ||
                (transferCounter.monthlyCount + _value > _monthlyLimit))
        ) {
            return false;
        }

        // If the day has finished, check the monthly counter and if the month has finished
        if (
            _isDayFinished(_from) &&
            (_value + transferCounter.monthlyCount > _monthlyLimit)
        ) {
            return _isMonthFinished(_from);
        }

        return true;
    }

    /**
     * @dev Internal view function to check if the day has finished for an address.
     * @param _account The address to check.
     * @return True if the day has finished, false otherwise.
     */
    function _isDayFinished(address _account) internal view returns (bool) {
        return
            _erc3643ComplianceDMLimStorage()
                .usersCounters[_account]
                .dailyTimer <= _blockTimestamp();
    }

    /**
     * @dev Internal view function to check if the month has finished for an address.
     * @param _account The address to check.
     * @return True if the month has finished, false otherwise.
     */
    function _isMonthFinished(address _account) internal view returns (bool) {
        return
            _erc3643ComplianceDMLimStorage()
                .usersCounters[_account]
                .monthlyTimer <= _blockTimestamp();
    }

    /**
     * @dev Internal function to access the ERC-3643 DayMonthLimits storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ERC3643ComplianceDMLimStorage struct in storage.
     */
    function _erc3643ComplianceDMLimStorage()
        private
        pure
        returns (ERC3643ComplianceDMLimStorage storage storage_)
    {
        bytes32 position = _ERC3643_COMPLIANCE_DMLIM_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
