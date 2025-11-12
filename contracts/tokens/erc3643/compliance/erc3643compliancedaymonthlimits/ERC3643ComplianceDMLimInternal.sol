// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_COMPLIANCE_DMLIM_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
import {DidDocumentDetailedInternal} from '../../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {IERC3643ComplianceHookEvents} from '../IERC3643ComplianceHookEvents.sol';
/**
 * @title ERC3643ComplianceDMLimInternal
 * @notice Internal contract for managing ERC-3643 daily/monthly transfer limits.
 * @dev Provides internal functions to read and write limit fields, check compliance, and update counters.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643ComplianceDMLimInternal is
    DidDocumentDetailedInternal,
    IERC3643ComplianceHookEvents
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
     * @param _from The address of the sender.
     * @param _amount The amount of tokens transferred.
     */
    function _transferActionOnDayMonthLimits(
        address _from,
        uint256 _amount
    ) internal {
        TransferCounter storage counter = _getTransferCounter(_from);

        // Reset timers if needed
        if (_isDayFinished(_from)) {
            counter.dailyTimer = block.timestamp + 1 days;
            counter.dailyCount = 0;
        }
        if (_isMonthFinished(_from)) {
            counter.monthlyTimer = block.timestamp + 30 days;
            counter.monthlyCount = 0;
        }

        // Update counters (los límites ya han sido validados en compliance)
        counter.dailyCount += _amount;
        counter.monthlyCount += _amount;
    }

    /**
     * @dev Internal hook for post-mint operations for DayMonthLimits feature.
     *      Intentionally left empty for feature mapping.
     * @param _to The address receiving minted tokens.
     * @param _amount The amount of tokens minted.
     */
    // solhint-disable no-empty-blocks
    function _creationActionOnDayMonthLimits(
        address _to,
        uint256 _amount
    ) internal {
        // Emit event to ensure coverage tools can detect execution
        // LOG opcode is non-optimizable and always generates bytecode
        emit CoverageHookDayMonthLimits(_to, _amount);
    }

    /**
     * @dev Internal hook for post-burn operations for DayMonthLimits feature.
     *      Intentionally left empty for feature mapping.
     *      Emits CoverageHookDayMonthLimits event to generate detectable bytecode for solidity-coverage.
     * @param _from The address from which tokens are burned.
     * @param _amount The amount of tokens burned.
     */
    function _destructionActionOnDayMonthLimits(
        address _from,
        uint256 _amount
    ) internal {
        // Emit event to ensure coverage tools can detect execution
        // LOG opcode is non-optimizable and always generates bytecode
        emit CoverageHookDayMonthLimits(_from, _amount);
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
        ERC3643ComplianceDMLimStorage
            storage $ = _erc3643ComplianceDMLimStorage();
        return $.usersCounters[_account];
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
        if (_from != address(0)) {
            TransferCounter storage counter = _getTransferCounter(_from);

            uint256 _dailyLimit = _getDailyLimit();
            uint256 _monthlyLimit = _getMonthlyLimit();

            // Si el valor excede el daily limit, rechaza
            if (_value > _dailyLimit) {
                return false;
            }

            // Si el día no ha terminado, chequea los contadores diarios y mensuales
            if (
                !_isDayFinished(_from) &&
                ((counter.dailyCount + _value > _dailyLimit) ||
                    (counter.monthlyCount + _value > _monthlyLimit))
            ) {
                return false;
            }

            // Si el día ha terminado, chequea el contador mensual y si el mes ha terminado
            if (
                _isDayFinished(_from) &&
                (_value + counter.monthlyCount > _monthlyLimit)
            ) {
                return _isMonthFinished(_from);
            }

            return true;
        } else {
            return true;
        }
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
                .dailyTimer <= block.timestamp;
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
