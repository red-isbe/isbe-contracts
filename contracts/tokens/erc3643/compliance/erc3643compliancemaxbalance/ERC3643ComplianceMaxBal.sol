// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
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
    ) external initializer(_ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY) {
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
    ) external override onlyRole(_COMPLIANCE_ROLE) {
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
     * @param to The address of the receiver.
     * @param amount The amount of tokens to transfer.
     * @return isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnMaxBalance(
        address to,
        uint256 amount
    ) external view override returns (bool isCompliant) {
        return _complianceCheckOnMaxBalance(to, amount);
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
