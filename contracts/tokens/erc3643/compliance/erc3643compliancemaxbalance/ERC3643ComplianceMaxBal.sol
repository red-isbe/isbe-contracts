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
    _ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY
} from '../../../../constants/resolverKeys.sol';
import {
    _ERC3643_COMPLIANCE_MAXBALANCE_FACET_VERSION
} from '../../../../constants/facetVersions.sol';
import {
    ERC203643InternalCommon
} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643ComplianceMaxBal} from './IERC3643ComplianceMaxBal.sol';
import {_COMPLIANCE_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643ComplianceMaxBalance
 * @notice External contract implementing ERC-3643 MaxBalance compliance feature.
 * @dev Provides public methods to update and retrieve the max balance restriction.
 *      Uses COMPLIANCE_ROLE for granular permission control.
 */
abstract contract ERC3643ComplianceMaxBal is
    IERC3643ComplianceMaxBal,
    ERC203643InternalCommon
{
    /**
     * @dev Disables further initializations for this facet using its resolver key.
     */
    constructor() {
        _disableInitializers(_ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the max balance restriction.
     * @dev Can only be called once via the initializer modifier.
     * @param _maxBalance The initial max balance value.
     */
    function initializeERC3643ComplianceMaxBalance(
        uint256 _maxBalance
    )
        external
        override
        initializer(
            _ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
            _ERC3643_COMPLIANCE_MAXBALANCE_FACET_VERSION
        )
    {
        _initializeMaxBalance(_maxBalance);
        emit MaxBalanceSet(_maxBalance);
    }

    /**
     * @notice Updates the max balance restriction.
     * @dev Restricted to compliance role.
     * @param _maxBalance The new max balance value.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     *
     * Emits:
     * - {MaxBalanceSet} event with the new max balance value
     */
    function setMaxBalance(
        uint256 _maxBalance
    ) external override onlyRole(_COMPLIANCE_ROLE) whenNotPaused {
        _setMaxBalance(_maxBalance);
        emit MaxBalanceSet(_maxBalance);
    }

    /**
     * @notice Returns the current max balance restriction.
     * @return _maxBalance The current max balance value.
     */
    function maxBalance() external view override returns (uint256 _maxBalance) {
        return _getMaxBalance();
    }

    /**
     * @notice Checks if a transfer respects the max balance restriction.
     * @dev Uses ERC20Internal balance primitive for the receiver.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens to transfer.
     * @return _isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnMaxBalance(
        address _to,
        uint256 _amount
    ) external view override returns (bool _isCompliant) {
        return _complianceCheckOnMaxBalance(_to, _amount);
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
        interfaces_[--interfacesLength] = type(IERC3643ComplianceMaxBal)
            .interfaceId;
    }
}
