// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_COMPLIANCE_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {_COMPLIANCE_ROLE} from '../../../constants/roles.sol';
import {ICompliance} from './ICompliance.sol';
import {ERC203643InternalCommon} from '../../erc203643/ERC203643InternalCommon.sol';

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
     * @param maxBalanceEnabled Initial value for MaxBalance feature activation.
     */
    function initializeERC3643Compliance(
        bool maxBalanceEnabled,
        bool dailyMonthLimitsEnabled
    ) external override initializer(_ERC3643_COMPLIANCE_RESOLVER_KEY) {
        _initialize(maxBalanceEnabled, dailyMonthLimitsEnabled);
        emit ComplianceFeatureToggled('MaxBalance', maxBalanceEnabled);
        emit ComplianceFeatureToggled(
            'DailyMonthLimits',
            dailyMonthLimitsEnabled
        );
    }

    // --- Set MaxBalance Activation ---

    /**
     * @notice Enables or disables the MaxBalance feature.
     * @dev Restricted to compliance role.
     * @param enabled True to enable, false to disable.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     */
    function setMaxBalanceEnabled(
        bool enabled
    ) external onlyRole(_COMPLIANCE_ROLE) {
        _setMaxBalanceEnabled(enabled);
        emit ComplianceFeatureToggled('MaxBalance', enabled);
    }

    // --- Set Daily/Monthly Limits Activation ---
    /**
     * @notice Enables or disables the Daily/Monthly Limits feature.
     * @dev Restricted to compliance role.
     * @param enabled True to enable, false to disable.
     *
     * Requirements:
     * - Caller must have COMPLIANCE_ROLE
     */
    function setDailyMonthLimitsEnabled(
        bool enabled
    ) external onlyRole(_COMPLIANCE_ROLE) {
        _setDailyMonthLimitsEnabled(enabled);
        emit ComplianceFeatureToggled('DailyMonthLimits', enabled);
    }

    // --- ICompliance Hooks ---

    /**
     * @notice Called after tokens are transferred.
     * @dev Implements ICompliance. Delegates to internal logic.
     * @param _from The address of the sender.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens transferred.
     */
    function transferred(
        address _from,
        address _to,
        uint256 _amount
    ) external override onlyRole(_COMPLIANCE_ROLE) {
        _transferred(_from, _to, _amount);
    }

    /**
     * @notice Called after tokens are minted.
     * @dev Implements ICompliance. Delegates to internal logic.
     * @param _to The address receiving the minted tokens.
     * @param _amount The amount of tokens minted.
     */
    function created(
        address _to,
        uint256 _amount
    ) external override onlyRole(_COMPLIANCE_ROLE) {
        _created(_to, _amount);
    }

    /**
     * @notice Called after tokens are burned.
     * @dev Implements ICompliance. Delegates to internal logic.
     * @param _from The address from which tokens are burned.
     * @param _amount The amount of tokens burned.
     */
    function destroyed(
        address _from,
        uint256 _amount
    ) external override onlyRole(_COMPLIANCE_ROLE) {
        _destroyed(_from, _amount);
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
