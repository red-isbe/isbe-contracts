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
     * @notice Struct to hold frozen state information
     */
    struct FrozenState {
        uint256 frozenTokens;
        bool wasAddressFrozen;
    }

    modifier onlyWithRecoveryPair(address _lostWallet, address _newWallet) {
        _checkRecoveryPairAddresses(_lostWallet, _newWallet);
        _;
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
    )
        external
        override
        whenNotPaused
        onlyRole(_RECOVERY_ROLE)
        onlyWhitelisted(_newWallet)
        onlyWhitelisted(_lostWallet)
        onlyWithRecoveryPair(_lostWallet, _newWallet)
        returns (bool)
    {
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
     * @notice Restores frozen state to the new wallet.
     * @dev This function is used to restore the frozen state of the tokens after a recovery operation.
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
     * @notice Checks if the lost wallet has tokens to recover.
     * @dev This function checks if the lost wallet has a non-zero balance before attempting recovery.
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
     * @notice Captures the current frozen state of a wallet.
     * @dev This function captures the frozen token count and freeze status of a wallet.
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
     * @notice Validates all recovery input parameters.
     * @dev This function validates the lost and new wallet addresses, ensuring they are valid and different.
     * @param _lostWallet The lost wallet address to validate.
     * @param _newWallet The new wallet address to validate.
     *
     * Reverts:
     * - {InvalidLostWallet} if lost wallet is zero address.
     * - {InvalidNewWallet} if new wallet is zero address.
     * - {SameWalletAddress} if lost and new wallets are the same.
     */
    function _checkRecoveryPairAddresses(
        address _lostWallet,
        address _newWallet
    ) internal pure {
        _checkAddressIsNotZero(_lostWallet);
        _checkAddressIsNotZero(_newWallet);
        require(
            _lostWallet != _newWallet,
            IERC3643Recovery.SameWalletAddress()
        );
    }

    /**
     * @notice Declares the interfaces implemented by this facet.
     * @dev This function declares the interfaces implemented by the contract.
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
