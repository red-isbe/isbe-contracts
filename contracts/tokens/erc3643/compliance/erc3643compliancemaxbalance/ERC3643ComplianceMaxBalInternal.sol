// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Internal} from '../../../erc20/ERC20Internal.sol';
import {_ERC3643_COMPLIANCE_MAXBALANCE_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
import {IERC3643ComplianceMaxBal} from './IERC3643ComplianceMaxBal.sol';
/**
 * @title ERC3643ComplianceMaxBalanceInternal
 * @notice Internal contract for managing ERC-3643 MaxBalance restriction.
 * @dev Provides internal functions to read and write the max balance field and check compliance for transfers.
 *      This contract does not emit events or apply access control.
 *      Balances are read directly from ERC20Internal primitives.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643ComplianceMaxBalInternal is ERC20Internal {
    /// @dev Storage structure for ERC-3643 MaxBalance restriction.
    struct ERC3643ComplianceMaxBalanceStorage {
        uint256 maxBalance;
    }

    /**
     * @dev Internal function to initialize the max balance restriction in storage.
     * Sets the initial value for the max balance.
     * @param _maxBalance The initial max balance value to assign.
     */
    function _initializeMaxBalance(uint256 _maxBalance) internal {
        _setMaxBalance(_maxBalance);
    }

    /**
     * @dev Internal function to update the max balance value in storage.
     * @param _maxBalance The new max balance value to assign.
     */
    function _setMaxBalance(uint256 _maxBalance) internal {
        _erc3643ComplianceMaxBalanceStorage().maxBalance = _maxBalance;
    }

    /**
     * @dev Internal hook for post-transfer operations for MaxBalance feature.
     *      Intentionally left empty for feature mapping.
     *      Emits MaxBalanceTransferHook event.
     * @param _from The address of the sender.
     * @param _amount The amount of tokens transferred.
     */
    // solhint-disable no-empty-blocks
    function _transferActionOnMaxBalance(
        address _from,
        uint256 _amount
    ) internal {
        emit IERC3643ComplianceMaxBal.MaxBalanceTransferHook(_from, _amount);
    }

    /**
     * @dev Internal hook for post-mint operations for MaxBalance feature.
     *      Intentionally left empty for feature mapping.
     *      Emits MaxBalanceCreationHook event.
     * @param _to The address receiving minted tokens.
     * @param _amount The amount of tokens minted.
     */
    // solhint-disable no-empty-blocks
    function _creationActionOnMaxBalance(
        address _to,
        uint256 _amount
    ) internal {
        emit IERC3643ComplianceMaxBal.MaxBalanceCreationHook(_to, _amount);
    }
    /**
     * @dev Internal hook for post-burn operations for MaxBalance feature.
     *      Intentionally left empty for feature mapping.
     *      Emits MaxBalanceDestructionHook event.
     * @param _from The address from which tokens are burned.
     * @param _amount The amount of tokens burned.
     */
    function _destructionActionOnMaxBalance(
        address _from,
        uint256 _amount
    ) internal {
        emit IERC3643ComplianceMaxBal.MaxBalanceDestructionHook(_from, _amount);
    }

    /**
     * @dev Internal view function to retrieve the current max balance value from storage.
     * @return The current max balance value.
     */
    function _getMaxBalance() internal view returns (uint256) {
        return _erc3643ComplianceMaxBalanceStorage().maxBalance;
    }

    /**
     * @dev Internal view function to check if a transfer respects the max balance restriction.
     * Uses ERC20Internal balance primitive for the receiver.
     * @param _to The address of the receiver.
     * @param _amount The amount of tokens to transfer.
     * @return True if compliant, false otherwise.
     */
    function _complianceCheckOnMaxBalance(
        address _to,
        uint256 _amount
    ) internal view returns (bool) {
        return (_balanceOf(_to) + _amount) <= _getMaxBalance();
    }

    /**
     * @dev Internal function to access the ERC-3643 MaxBalance storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ERC3643ComplianceMaxBalanceStorage struct in storage.
     */
    function _erc3643ComplianceMaxBalanceStorage()
        private
        pure
        returns (ERC3643ComplianceMaxBalanceStorage storage storage_)
    {
        bytes32 position = _ERC3643_COMPLIANCE_MAXBALANCE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
