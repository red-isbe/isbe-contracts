// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../../core/Common.sol';
import {_ERC3643_COMPLIANCE_DMLIM_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/**
 * @title ERC3643ComplianceDMLimInternal
 * @notice Internal contract for managing ERC-3643 daily/monthly transfer limits.
 * @dev Provides internal functions to read and write limit fields, check compliance, and update counters.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643ComplianceDMLimInternal is Common {
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
        ERC3643ComplianceDMLimStorage
            storage $ = _erc3643ComplianceDMLimStorage();
        $.dailyLimit = _dailyLimit;
    }

    /**
     * @dev Internal function to update the monthly limit value in storage.
     * @param _monthlyLimit The new monthly limit value to assign.
     */
    function _setMonthlyLimit(uint256 _monthlyLimit) internal {
        ERC3643ComplianceDMLimStorage
            storage $ = _erc3643ComplianceDMLimStorage();
        $.monthlyLimit = _monthlyLimit;
    }

    /**
     * @dev Internal hook for post-transfer operations for DayMonthLimits feature.
     *      Updates daily and monthly counters.
     * @param from The address of the sender.
     * @param amount The amount of tokens transferred.
     */
    function _transferActionOnDayMonthLimits(
        address from,
        uint256 amount
    ) internal {
        TransferCounter storage counter = _getTransferCounter(from);

        // Reset timers if needed
        if (_isDayFinished(from)) {
            counter.dailyTimer = block.timestamp + 1 days;
            counter.dailyCount = 0;
        }
        if (_isMonthFinished(from)) {
            counter.monthlyTimer = block.timestamp + 30 days;
            counter.monthlyCount = 0;
        }

        // Update counters
        if ((counter.dailyCount + amount) <= _getDailyLimit()) {
            counter.dailyCount += amount;
        }
        if ((counter.monthlyCount + amount) <= _getMonthlyLimit()) {
            counter.monthlyCount += amount;
        }
    }

    /**
     * @dev Internal hook for post-mint operations for DayMonthLimits feature.
     *      Intentionally left empty for feature mapping.
     * @param to The address receiving minted tokens.
     * @param amount The amount of tokens minted.
     */
    // solhint-disable no-empty-blocks
    function _creationActionOnDayMonthLimits(
        address to,
        uint256 amount
    ) internal {}

    /**
     * @dev Internal hook for post-burn operations for DayMonthLimits feature.
     *      Intentionally left empty for feature mapping.
     * @param from The address from which tokens are burned.
     * @param amount The amount of tokens burned.
     */
    // solhint-disable no-empty-blocks
    function _destructionActionOnDayMonthLimits(
        address from,
        uint256 amount
    ) internal {}

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
     * @param account The address to query.
     * @return counter The TransferCounter struct for the address.
     */
    function _getTransferCounter(
        address account
    ) internal view returns (TransferCounter storage counter) {
        ERC3643ComplianceDMLimStorage
            storage $ = _erc3643ComplianceDMLimStorage();
        return $.usersCounters[account];
    }

    /**
     * @dev Internal view function to check if a transfer respects the daily/monthly limits.
     * @param from The address of the sender.
     * @param value The amount of tokens to transfer.
     * @return True if compliant, false otherwise.
     */
    function _complianceCheckOnDayMonthLimits(
        address from,
        uint256 value
    ) internal view returns (bool) {
        TransferCounter storage counter = _getTransferCounter(from);

        uint256 dailyLimit = _getDailyLimit();
        uint256 monthlyLimit = _getMonthlyLimit();

        // Si el valor excede el daily limit, rechaza
        if (value > dailyLimit) {
            return false;
        }

        // Si el día no ha terminado, chequea los contadores diarios y mensuales
        if (
            !_isDayFinished(from) &&
            ((counter.dailyCount + value > dailyLimit) ||
                (counter.monthlyCount + value > monthlyLimit))
        ) {
            return false;
        }

        // Si el día ha terminado, chequea el contador mensual y si el mes ha terminado
        if (
            _isDayFinished(from) &&
            (value + counter.monthlyCount > monthlyLimit)
        ) {
            return _isMonthFinished(from);
        }

        return true;
    }

    /**
     * @dev Internal view function to check if the day has finished for an address.
     * @param account The address to check.
     * @return True if the day has finished, false otherwise.
     */
    function _isDayFinished(address account) internal view returns (bool) {
        return
            _erc3643ComplianceDMLimStorage()
                .usersCounters[account]
                .dailyTimer <= block.timestamp;
    }

    /**
     * @dev Internal view function to check if the month has finished for an address.
     * @param account The address to check.
     * @return True if the month has finished, false otherwise.
     */
    function _isMonthFinished(address account) internal view returns (bool) {
        return
            _erc3643ComplianceDMLimStorage()
                .usersCounters[account]
                .monthlyTimer <= block.timestamp;
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
