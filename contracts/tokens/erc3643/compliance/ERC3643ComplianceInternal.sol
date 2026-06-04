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
    ERC3643ComplianceMaxBalInternal
} from './erc3643compliancemaxbalance/ERC3643ComplianceMaxBalInternal.sol';
import {
    ERC3643ComplianceDMLimInternal
} from './erc3643compliancedaymonthlimits/ERC3643ComplianceDMLimInternal.sol';
import {
    _ERC3643_COMPLIANCE_STORAGE_POSITION
} from '../../../constants/storagePositions.sol';
import {ICompliance} from './ICompliance.sol';
import {
    IERC3643ComplianceDMLim
} from './erc3643compliancedaymonthlimits/IERC3643ComplianceDMLim.sol';
import {
    IERC3643ComplianceMaxBal
} from './erc3643compliancemaxbalance/IERC3643ComplianceMaxBal.sol';
import {
    _FLAG_MAX_BALANCE,
    _FLAG_DAILY_MONTH
} from '../../../constants/values.sol';

/**
 * @title ERC3643ComplianceInternal
 * @notice Internal contract for managing ERC-3643 MaxBalance compliance feature.
 * @dev Provides internal functions to activate/deactivate MaxBalance and check compliance.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643ComplianceInternal is
    ERC3643ComplianceMaxBalInternal,
    ERC3643ComplianceDMLimInternal
{
    /// @dev Storage structure for ERC-3643 compliance feature activation (extensible via mapping).
    struct ERC3643ComplianceStorage {
        mapping(bytes32 => bool) enabledFlags;
    }

    // --- Initialization ---

    /**
     * @dev Internal function to initialize MaxBalance feature activation in storage.
     * @param _maxBalanceEnabled Initial value for MaxBalance feature activation.
     * @param _dailyMonthLimitsEnabled Initial value for Daily/Month Limits feature activation.
     */
    function _initialize(
        bool _maxBalanceEnabled,
        bool _dailyMonthLimitsEnabled
    ) internal {
        _setMaxBalanceEnabled(_maxBalanceEnabled);
        _setDailyMonthLimitsEnabled(_dailyMonthLimitsEnabled);
    }

    // --- Set Activation ---

    /**
     * @dev Internal function to activate or deactivate MaxBalance feature.
     * @param _enabled True to activate, false to deactivate.
     */
    function _setMaxBalanceEnabled(bool _enabled) internal {
        _erc3643complianceStorage().enabledFlags[_FLAG_MAX_BALANCE] = _enabled;
    }

    /**
     * @dev Internal function to activate or deactivate Daily/Monthly Limits feature.
     * @param _enabled True to activate, false to deactivate.
     */
    function _setDailyMonthLimitsEnabled(bool _enabled) internal {
        _erc3643complianceStorage().enabledFlags[_FLAG_DAILY_MONTH] = _enabled;
    }

    // --- Compliance Hooks ---

    /**
     * @dev Internal hook called after tokens are transferred.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens transferred.
     * @return Always returns true for MaxBalance feature.
     */
    function _transferred(
        address _from,
        address _to,
        uint256 _amount
    ) internal returns (bool) {
        // Llamar al hook de MaxBalance para cobertura, aunque esté vacío
        if (_isMaxBalanceEnabled()) {
            emit IERC3643ComplianceMaxBal.MaxBalanceTransferHook(
                _from,
                _amount
            );
        }
        if (_isDailyMonthLimitsEnabled()) {
            _transferActionOnDayMonthLimits(_from, _amount);
            emit IERC3643ComplianceDMLim.DayMonthLimitsTransferHook(
                _from,
                _amount
            );
        }

        // Emitir evento solo si algún flag de compliance está activo
        if (_isMaxBalanceEnabled() || _isDailyMonthLimitsEnabled()) {
            emit ICompliance.ComplianceTransferred(_from, _to, _amount);
        }
        return true;
    }

    /**
     * @dev Internal hook called after tokens are minted.
     * @param _to The address receiving the minted tokens.
     * @param _amount The amount of tokens minted.
     * @return Always returns true for MaxBalance feature.
     */
    function _created(address _to, uint256 _amount) internal returns (bool) {
        // Llamar al hook de MaxBalance para cobertura, aunque esté vacío
        if (_isMaxBalanceEnabled()) {
            emit IERC3643ComplianceMaxBal.MaxBalanceCreationHook(_to, _amount);
        }
        // Llamar al hook de DayMonthLimits para cobertura, aunque esté vacío
        if (_isDailyMonthLimitsEnabled()) {
            emit IERC3643ComplianceDMLim.DayMonthLimitsCreationHook(
                _to,
                _amount
            );
        }
        // Emitir evento solo si algún flag de compliance está activo
        if (_isMaxBalanceEnabled() || _isDailyMonthLimitsEnabled()) {
            emit ICompliance.ComplianceCreated(_to, _amount);
        }
        return true;
    }

    /**
     * @dev Internal hook called after tokens are burned.
     * @param _from The address from which tokens are burned.
     * @param _amount The amount of tokens burned.
     * @return Always returns true for MaxBalance feature.
     */
    function _destroyed(
        address _from,
        uint256 _amount
    ) internal returns (bool) {
        // Llamar al hook de MaxBalance para cobertura, aunque esté vacío
        if (_isMaxBalanceEnabled()) {
            emit IERC3643ComplianceMaxBal.MaxBalanceDestructionHook(
                _from,
                _amount
            );
        }
        // Llamar al hook de DayMonthLimits para simetría y cobertura, aunque esté vacío
        if (_isDailyMonthLimitsEnabled()) {
            emit IERC3643ComplianceDMLim.DayMonthLimitsDestructionHook(
                _from,
                _amount
            );
        }
        // Emitir evento solo si algún flag de compliance está activo
        if (_isMaxBalanceEnabled() || _isDailyMonthLimitsEnabled()) {
            emit ICompliance.ComplianceDestroyed(_from, _amount);
        }
        return true;
    }

    // --- Get  Activation ---

    /**
     * @dev Internal view function to check if MaxBalance feature is enabled.
     * @return True if MaxBalance is enabled, false otherwise.
     */
    function _isMaxBalanceEnabled() internal view returns (bool) {
        return _erc3643complianceStorage().enabledFlags[_FLAG_MAX_BALANCE];
    }

    /**
     * @dev Internal view function to check if Daily/Monthly Limits feature is enabled.
     * @return True if Daily/Monthly Limits are enabled, false otherwise.
     */
    function _isDailyMonthLimitsEnabled() internal view returns (bool) {
        return _erc3643complianceStorage().enabledFlags[_FLAG_DAILY_MONTH];
    }

    /**
     * @dev Internal view function to check compliance before a transfer.
     * Delegates to MaxBalance feature if enabled.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens to transfer.
     * @return True if the transfer is compliant, false otherwise.
     */
    function _canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal view returns (bool) {
        return
            _isMaxBalanceCompliance(_to, _amount) &&
            _isLimitCompliance(_from, _amount);
    }

    function _isMaxBalanceCompliance(
        address _to,
        uint256 _amount
    ) private view returns (bool) {
        return
            !_isMaxBalanceEnabled() ||
            _complianceCheckOnMaxBalance(_to, _amount);
    }

    function _isLimitCompliance(
        address _from,
        uint256 _amount
    ) private view returns (bool) {
        return
            !_isDailyMonthLimitsEnabled() ||
            _complianceCheckOnDayMonthLimits(_from, _amount);
    }

    // --- Storage Accessor ---

    /**
     * @dev Internal function to access the ERC-3643 compliance storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ERC3643ComplianceStorage struct in storage.
     */
    function _erc3643complianceStorage()
        private
        pure
        returns (ERC3643ComplianceStorage storage storage_)
    {
        bytes32 position = _ERC3643_COMPLIANCE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
