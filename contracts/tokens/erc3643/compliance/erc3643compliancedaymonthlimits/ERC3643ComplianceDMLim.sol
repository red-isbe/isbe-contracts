// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {IERC3643ComplianceDMLim} from './IERC3643ComplianceDMLim.sol';
import {ERC3643ComplianceDMLimInternal} from './ERC3643ComplianceDMLimInternal.sol';
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
     * @param dailyLimit_ The initial daily transfer limit.
     * @param monthlyLimit_ The initial monthly transfer limit.
     */
    function initializeERC3643ComplianceDMLim(
        uint256 dailyLimit_,
        uint256 monthlyLimit_
    ) external initializer(_ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY) {
        _initializeDMLim(dailyLimit_, monthlyLimit_);
        emit DayMonthLimitsSet(dailyLimit_, monthlyLimit_);
    }

    /**
     * @notice Sets the daily transfer limit.
     * @dev Restricted to compliance role.
     * @param dailyLimit_ The new daily transfer limit.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     *
     * Emits:
     * - {DayMonthLimitsSet} event with the new limits
     */
    function setDailyLimit(
        uint256 dailyLimit_
    ) external override onlyRole(_COMPLIANCE_ROLE) {
        _setDailyLimit(dailyLimit_);
        emit DayMonthLimitsSet(_getDailyLimit(), _getMonthlyLimit());
    }

    /**
     * @notice Sets the monthly transfer limit.
     * @dev Restricted to compliance role.
     * @param monthlyLimit_ The new monthly transfer limit.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     *
     * Emits:
     * - {DayMonthLimitsSet} event with the new limits
     */
    function setMonthlyLimit(
        uint256 monthlyLimit_
    ) external override onlyRole(_COMPLIANCE_ROLE) {
        _setMonthlyLimit(monthlyLimit_);
        emit DayMonthLimitsSet(_getDailyLimit(), _getMonthlyLimit());
    }

    /**
     * @notice Returns the current daily transfer limit.
     * @return dailyLimit_ The daily transfer limit.
     */
    function dailyLimit() external view override returns (uint256 dailyLimit_) {
        return _getDailyLimit();
    }

    /**
     * @notice Returns the current monthly transfer limit.
     * @return monthlyLimit_ The monthly transfer limit.
     */
    function monthlyLimit()
        external
        view
        override
        returns (uint256 monthlyLimit_)
    {
        return _getMonthlyLimit();
    }

    /**
     * @notice Checks if a transfer respects the daily/monthly limits.
     * @param from The address of the sender.
     * @param amount The amount of tokens to transfer.
     * @return isCompliant True if compliant, false otherwise.
     */
    function complianceCheckOnDayMonthLimits(
        address from,
        uint256 amount
    ) external view override returns (bool isCompliant) {
        return _complianceCheckOnDayMonthLimits(from, amount);
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
