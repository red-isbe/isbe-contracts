// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Recovery} from './IERC3643Recovery.sol';
import {_RECOVERY_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643Recovery
 * @notice External contract implementing ERC-3643 recovery functionality.
 * @dev Allows authorized agents to recover tokens from lost wallets to new wallets.
 *      Extends ERC203643InternalCommon which aggregates all internal contracts,
 *      providing access to all necessary internal functions.
 *
 * Architecture Note:
 * Unlike other ERC3643 modules (Freeze, Metadata, Regulatory), this contract does NOT have
 * a separate ERC3643RecoveryInternal contract because:
 *
 * 1. NO STORAGE: Recovery operations don't require dedicated storage. All state is managed
 *    through existing modules (balances in ERC20, frozen state in Freeze).
 *
 * 2. CROSS-MODULE DEPENDENCIES: All recovery helper functions need access to functions from
 *    multiple modules (_balanceOf, _transfer, _getFrozenTokens, _isFrozen, _setAddressFrozen,
 *    _freezePartialTokens). These are only available through
 *    ERC203643InternalCommon, not from a standalone internal contract extending Common.
 *
 * 3. ACCESSIBILITY: By placing internal helper functions directly in this external contract
 *    (which extends ERC203643InternalCommon), they have immediate access to all required
 *    cross-module functionality without violating the architectural pattern.
 *
 * Internal contracts in the ERC3643 pattern (like ERC3643FreezeInternal) extend only Common
 * and manage their own isolated storage. Recovery has no storage of its own and orchestrates
 * operations across multiple existing modules, making it a special case where the internal
 * helpers belong in the external contract.
 */
abstract contract ERC3643Recovery is IERC3643Recovery, ERC203643InternalCommon {
    /**
     * @dev Struct to hold frozen state information
     */
    struct FrozenState {
        uint256 frozenTokens;
        bool wasAddressFrozen;
    }

    /**
     * @notice Recovers tokens from a lost wallet to a new wallet.
     * @dev This function should only be callable by an authorized recovery agent.
     *      Performs comprehensive validation and transfers all tokens from lost to new wallet.
     *
     *      If the lost wallet has frozen tokens, they will be automatically unfrozen
     *      before the transfer to ensure complete recovery.
     *
     * Requirements:
     * - Caller must have RECOVERY_ROLE
     * - Contract must not be paused
     * - _lostWallet must not be zero address
     * - _newWallet must not be zero address
     * - _lostWallet and _newWallet must not be the same
     *
     * Emits:
     * - {RecoverySuccess} event with lost and new wallet addresses
     *
     * @param _lostWallet The wallet that was lost
     * @param _newWallet The new wallet to which tokens will be transferred
     * @return success True if recovery was successful, false otherwise
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet
    ) external override whenNotPaused onlyRole(_RECOVERY_ROLE) returns (bool) {
        // 1. Validate all input parameters
        _validateRecoveryInputs(_lostWallet, _newWallet);

        // 2. Check balance availability
        uint256 lostWalletBalance = _checkRecoverableBalance(_lostWallet);

        // 3. Capture frozen state before transfer
        FrozenState memory frozenState = _captureFrozenState(_lostWallet);

        // 4. Transfer all tokens
        _transfer(_lostWallet, _newWallet, lostWalletBalance);

        // 5. Restore frozen state
        _restoreFrozenState(_newWallet, frozenState);

        // 6. Emit success event
        emit RecoverySuccess(_lostWallet, _newWallet);

        return true;
    }

    // ============================================================
    // INTERNAL HELPER FUNCTIONS
    // ============================================================

    /**
     * @dev Restores frozen state to the new wallet.
     * @param _newWallet The wallet to restore frozen state to.
     * @param _frozenState The frozen state to restore.
     */
    function _restoreFrozenState(
        address _newWallet,
        FrozenState memory _frozenState
    ) internal {
        if (_frozenState.frozenTokens > 0) {
            _freezePartialTokens(_newWallet, _frozenState.frozenTokens);
        }
        if (_frozenState.wasAddressFrozen) {
            _setAddressFrozen(_newWallet, true);
        }
    }

    /**
     * @dev Checks if the lost wallet has tokens to recover.
     * @param _lostWallet The wallet to check.
     * @return balance The balance of the lost wallet.
     *
     * Reverts:
     * - {NoTokensToRecover} if the wallet has zero balance.
     */
    function _checkRecoverableBalance(
        address _lostWallet
    ) internal view returns (uint256 balance) {
        balance = _balanceOf(_lostWallet);
        require(balance != 0, IERC3643Recovery.NoTokensToRecover());
    }

    /**
     * @dev Captures the current frozen state of a wallet.
     * @param _wallet The wallet to capture state from.
     * @return frozenState Struct containing frozen tokens count and freeze status.
     */
    function _captureFrozenState(
        address _wallet
    ) internal view returns (FrozenState memory frozenState) {
        frozenState.frozenTokens = _getFrozenTokens(_wallet);
        frozenState.wasAddressFrozen = _isFrozen(_wallet);
    }

    /**
     * @dev Validates all recovery input parameters.
     * @param _lostWallet The lost wallet address to validate.
     * @param _newWallet The new wallet address to validate.
     *
     * Reverts:
     * - {InvalidLostWallet} if lost wallet is zero address.
     * - {InvalidNewWallet} if new wallet is zero address.
     * - {SameWalletAddress} if lost and new wallets are the same.
     */
    function _validateRecoveryInputs(
        address _lostWallet,
        address _newWallet
    ) internal pure {
        if (_lostWallet == address(0)) {
            revert IERC3643Recovery.InvalidLostWallet();
        }
        if (_newWallet == address(0)) {
            revert IERC3643Recovery.InvalidNewWallet();
        }
        if (_lostWallet == _newWallet) {
            revert IERC3643Recovery.SameWalletAddress();
        }
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
        interfaces_[--interfacesLength] = type(IERC3643Recovery).interfaceId;
    }
}