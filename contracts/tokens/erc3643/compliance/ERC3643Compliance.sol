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
    _ERC3643_COMPLIANCE_RESOLVER_KEY
} from '../../../constants/resolverKeys.sol';
import {
    _ERC3643_COMPLIANCE_FACET_VERSION
} from '../../../constants/facetVersions.sol';
import {_COMPLIANCE_ROLE} from '../../../constants/roles.sol';
import {ICompliance} from './ICompliance.sol';
import {
    ERC203643InternalCommon
} from '../../erc203643/ERC203643InternalCommon.sol';

/**
 * @title ERC3643Compliance
 * @notice External contract implementing ERC-3643 compliance management (MaxBalance only).
 * @dev Provides public methods to activate/deactivate MaxBalance and check compliance.
 *      Uses COMPLIANCE_ROLE for granular permission control.
 */
abstract contract ERC3643Compliance is ICompliance, ERC203643InternalCommon {
    /**
     * @dev Disables further initializations for this facet using its resolver key.
     */
    constructor() {
        _disableInitializers(_ERC3643_COMPLIANCE_RESOLVER_KEY);
    }

    // --- Initialization ---

    /**
     * @notice Initializes the MaxBalance feature activation.
     * @dev Can only be called once via the initializer modifier.
     * @param _maxBalanceEnabled Initial value for MaxBalance feature activation.
     * @param _dailyMonthLimitsEnabled Initial value for Daily/Month Limits feature activation.
     */
    function initializeERC3643Compliance(
        bool _maxBalanceEnabled,
        bool _dailyMonthLimitsEnabled
    )
        external
        override
        initializer(
            _ERC3643_COMPLIANCE_RESOLVER_KEY,
            _ERC3643_COMPLIANCE_FACET_VERSION
        )
    {
        _initialize(_maxBalanceEnabled, _dailyMonthLimitsEnabled);
        emit ComplianceFeatureToggled('MaxBalance', _maxBalanceEnabled);
        emit ComplianceFeatureToggled(
            'DailyMonthLimits',
            _dailyMonthLimitsEnabled
        );
        emit ComplianceInitialized(
            _maxBalanceEnabled,
            _dailyMonthLimitsEnabled
        );
    }

    // --- Set MaxBalance Activation ---

    /**
     * @notice Enables or disables the MaxBalance feature.
     * @dev Restricted to compliance role.
     * @param _enabled True to enable, false to disable.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     * - Contract must not be paused
     */
    function setMaxBalanceEnabled(
        bool _enabled
    ) external onlyRole(_COMPLIANCE_ROLE) whenNotPaused {
        _setMaxBalanceEnabled(_enabled);
        emit ComplianceFeatureToggled('MaxBalance', _enabled);
    }

    // --- Set Daily/Monthly Limits Activation ---
    /**
     * @notice Enables or disables the Daily/Monthly Limits feature.
     * @dev Restricted to compliance role.
     * @param _enabled True to enable, false to disable.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     * - Contract must not be paused
     */
    function setDailyMonthLimitsEnabled(
        bool _enabled
    ) external onlyRole(_COMPLIANCE_ROLE) whenNotPaused {
        _setDailyMonthLimitsEnabled(_enabled);
        emit ComplianceFeatureToggled('DailyMonthLimits', _enabled);
    }

    // --- Get MaxBalance Activation ---

    /**
     * @notice Returns true if MaxBalance feature is enabled.
     * @return True if enabled, false otherwise.
     */
    function isMaxBalanceEnabled() external view returns (bool) {
        return _isMaxBalanceEnabled();
    }

    // --- Get Daily/Monthly Limits Activation ---
    /**
     * @notice Returns true if Daily/Monthly Limits feature is enabled.
     * @return True if enabled, false otherwise.
     */
    function isDailyMonthLimitsEnabled() external view returns (bool) {
        return _isDailyMonthLimitsEnabled();
    }

    /**
     * @notice Checks if a transfer is compliant.
     * @dev Implements ICompliance. Delegates to internal logic.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens to transfer.
     * @return True if the transfer is compliant, false otherwise.
     */
    function canTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external view override returns (bool) {
        return _canTransfer(_from, _to, _amount);
    }

    // --- Interfaces ---

    /**
     * @dev Declares the interfaces implemented by this facet.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(ICompliance).interfaceId;
    }
}
