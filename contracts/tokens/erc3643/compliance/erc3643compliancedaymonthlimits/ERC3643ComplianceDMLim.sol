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
    _ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY
} from '../../../../constants/resolverKeys.sol';
import {
    _ERC3643_COMPLIANCE_DMLIM_FACET_VERSION
} from '../../../../constants/facetVersions.sol';
import {IERC3643ComplianceDMLim} from './IERC3643ComplianceDMLim.sol';
import {
    ERC3643ComplianceDMLimInternal
} from './ERC3643ComplianceDMLimInternal.sol';
import {_COMPLIANCE_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643ComplianceDMLim
 * @notice External contract implementing ERC-3643 daily/monthly limits compliance feature.
 * @dev Provides public methods to update and retrieve the daily/monthly limits.
 *      Uses COMPLIANCE_ROLE for granular permission control.
 */
abstract contract ERC3643ComplianceDMLim is
    IERC3643ComplianceDMLim,
    ERC3643ComplianceDMLimInternal
{
    /**
     * @dev Disables further initializations for this facet using its resolver key.
     */
    constructor() {
        _disableInitializers(_ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the daily/monthly limits.
     * @dev Can only be called once via the initializer modifier.
     * @param _dailyLimit The initial daily transfer limit.
     * @param _monthlyLimit The initial monthly transfer limit.
     */
    function initializeERC3643ComplianceDMLim(
        uint256 _dailyLimit,
        uint256 _monthlyLimit
    )
        external
        override
        initializer(
            _ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
            _ERC3643_COMPLIANCE_DMLIM_FACET_VERSION
        )
    {
        _initializeDMLim(_dailyLimit, _monthlyLimit);
        emit DayMonthLimitsSet(_dailyLimit, _monthlyLimit);
    }

    /**
     * @notice Sets the daily transfer limit.
     * @dev Restricted to compliance role.
     * @param _dailyLimit The new daily transfer limit.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     *
     * Emits:
     * - {DayMonthLimitsSet} event with the new limits
     */
    function setDailyLimit(
        uint256 _dailyLimit
    ) external override onlyRole(_COMPLIANCE_ROLE) whenNotPaused {
        _setDailyLimit(_dailyLimit);
        emit DayMonthLimitsSet(_getDailyLimit(), _getMonthlyLimit());
    }

    /**
     * @notice Sets the monthly transfer limit.
     * @dev Restricted to compliance role.
     * @param _monthlyLimit The new monthly transfer limit.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     *
     * Emits:
     * - {DayMonthLimitsSet} event with the new limits
     */
    function setMonthlyLimit(
        uint256 _monthlyLimit
    ) external override onlyRole(_COMPLIANCE_ROLE) whenNotPaused {
        _setMonthlyLimit(_monthlyLimit);
        emit DayMonthLimitsSet(_getDailyLimit(), _getMonthlyLimit());
    }

    /**
     * @notice Returns the current daily transfer limit.
     * @return _dailyLimit The daily transfer limit.
     */
    function dailyLimit() external view override returns (uint256 _dailyLimit) {
        return _getDailyLimit();
    }

    /**
     * @notice Returns the current monthly transfer limit.
     * @return _monthlyLimit The monthly transfer limit.
     */
    function monthlyLimit()
        external
        view
        override
        whenNotPaused
        returns (uint256 _monthlyLimit)
    {
        return _getMonthlyLimit();
    }

    /**
     * @notice Checks if a transfer respects the daily/monthly limits.
     * @param _from The address of the sender.
     * @param _amount The amount of tokens to transfer.
     * @return _isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnDayMonthLimits(
        address _from,
        uint256 _amount
    ) external view override returns (bool _isCompliant) {
        return _complianceCheckOnDayMonthLimits(_from, _amount);
    }

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
        interfaces_[--interfacesLength] = type(IERC3643ComplianceDMLim)
            .interfaceId;
    }
}
