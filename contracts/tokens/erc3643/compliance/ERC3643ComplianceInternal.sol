// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC3643ComplianceMaxBalance} from './erc3643compliancemaxbalance/ERC3643ComplianceMaxBalance.sol';
import {_ERC3643_COMPLIANCE_STORAGE_POSITION} from '../../../constants/storagePositions.sol';

/**
 * @title ERC3643ComplianceInternal
 * @notice Internal contract for managing ERC-3643 MaxBalance compliance feature.
 * @dev Provides internal functions to activate/deactivate MaxBalance and check compliance.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643ComplianceInternal is ERC3643ComplianceMaxBalance {

    /// @dev Storage structure for ERC-3643 MaxBalance feature activation.
    struct ERC3643ComplianceStorage {
        bool maxBalanceEnabled;
    }

    // --- Initialization ---

    /**
     * @dev Internal function to initialize MaxBalance feature activation in storage.
     * @param _maxBalanceEnabled Initial value for MaxBalance feature activation.
     */
    function _initialize(bool _maxBalanceEnabled) internal {
        ERC3643ComplianceStorage storage $ = _erc3643complianceStorage();
        $.maxBalanceEnabled = _maxBalanceEnabled;
    }

    // --- Set MaxBalance Activation ---

    /**
     * @dev Internal function to activate or deactivate MaxBalance feature.
     * @param enabled True to activate, false to deactivate.
     */
    function _setMaxBalanceEnabled(bool enabled) internal {
        ERC3643ComplianceStorage storage $ = _erc3643complianceStorage();
        $.maxBalanceEnabled = enabled;
    }

    // --- Get MaxBalance Activation ---

    /**
     * @dev Internal view function to check if MaxBalance feature is enabled.
     * @return True if MaxBalance is enabled, false otherwise.
     */
    function _isMaxBalanceEnabled() internal view returns (bool) {
        ERC3643ComplianceStorage storage $ = _erc3643complianceStorage();
        return $.maxBalanceEnabled;
    }

    // --- Compliance Hooks ---

    /**
     * @dev Internal view function to check compliance before a transfer.
     * Delegates to MaxBalance feature if enabled.
     * @param from The address of the sender.
     * @param to The address of the receiver.
     * @param amount The amount of tokens to transfer.
     * @return True if the transfer is compliant, false otherwise.
     */
    function _canTransfer(address from, address to, uint256 amount) internal view returns (bool) {
        if (_isMaxBalanceEnabled()) {
            return _complianceCheckOnMaxBalance(to, amount);
        }
        return true;
    }

    /**
     * @dev Internal hook called after tokens are transferred.
     * @param from The address of the sender.
     * @param to The address of the receiver.
     * @param amount The amount of tokens transferred.
     * @return Always returns true for MaxBalance feature.
     */
    function _transferred(address from, address to, uint256 amount) internal view returns (bool) {
        return true;
    }

    /**
     * @dev Internal hook called after tokens are minted.
     * @param to The address receiving the minted tokens.
     * @param amount The amount of tokens minted.
     * @return Always returns true for MaxBalance feature.
     */
    function _created(address to, uint256 amount) internal view returns (bool) {
        return true;
    }

    /**
     * @dev Internal hook called after tokens are burned.
     * @param from The address from which tokens are burned.
     * @param amount The amount of tokens burned.
     * @return Always returns true for MaxBalance feature.
     */
    function _destroyed(address from, uint256 amount) internal view returns (bool) {
        return true;
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
        assembly {
            storage_.slot := position
        }
    }
}