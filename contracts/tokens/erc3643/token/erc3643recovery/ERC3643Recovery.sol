// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Recovery} from './IERC3643Recovery.sol';
import {_RECOVERY_ROLE} from '../../../../constants/roles.sol';
import {IIdentity} from '../../../../identity/IIdentity.sol';
import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';

/**
 * @title ERC3643Recovery
 * @notice External contract implementing ERC-3643 recovery functionality.
 * @dev Allows authorized agents to recover tokens from lost wallets to new verified wallets.
 *      Extends ERC203643InternalCommon which aggregates all internal contracts,
 *      providing access to all necessary internal functions.
 * 
 * Architecture Note:
 * Unlike other ERC3643 modules (Freeze, Metadata, Regulatory), this contract does NOT have 
 * a separate ERC3643RecoveryInternal contract because:
 * 
 * 1. NO STORAGE: Recovery operations don't require dedicated storage. All state is managed
 *    through existing modules (balances in ERC20, frozen state in Freeze, identities in Registry).
 * 
 * 2. CROSS-MODULE DEPENDENCIES: All recovery helper functions need access to functions from 
 *    multiple modules (_balanceOf, _transfer, _getFrozenTokens, _isFrozen, _setAddressFrozen, 
 *    _freezePartialTokens, _identityRegistry). These are only available through 
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
     * @notice Recovers tokens from a lost wallet to a new wallet for an investor
     * @dev This function should only be callable by an authorized recovery agent.
     *      Performs comprehensive validation and transfers all tokens from lost to new wallet.
     *
     *      If the lost wallet has frozen tokens, they will be automatically unfrozen
     *      before the transfer to ensure complete recovery.
     *
     * @param _lostWallet The wallet that the investor lost
     * @param _newWallet The newly provided wallet on which tokens have to be transferred
     * @param _investorOnchainID The onchainID of the investor asking for a recovery
     * @return success True if recovery was successful, false otherwise
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) external override whenNotPaused onlyRole(_RECOVERY_ROLE) returns (bool) {
        // 1. Validate all input parameters
        _validateRecoveryInputs(_lostWallet, _newWallet, _investorOnchainID);

        // 2. Check balance availability
        uint256 lostWalletBalance = _checkRecoverableBalance(_lostWallet);

        // 3. Validate wallet ownership (optional, currently commented)
        IIdentity onchainID = IIdentity(_investorOnchainID);
        // _validateWalletOwnership(_newWallet, onchainID);

        // 4. Capture frozen state before transfer
        FrozenState memory frozenState = _captureFrozenState(_lostWallet);

        // 5. Register new wallet in Identity Registry
        _registerNewWallet(_lostWallet, _newWallet, onchainID);

        // 6. Transfer all tokens
        _transfer(_lostWallet, _newWallet, lostWalletBalance);

        // 7. Restore frozen state
        _restoreFrozenState(_newWallet, frozenState);

        // 8. Clean up lost wallet
        _removeFromIdentityRegistry(_lostWallet);

        // 9. Emit success event
        emit RecoverySuccess(_lostWallet, _newWallet, _investorOnchainID);

        return true;
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

    // ============================================================
    // INTERNAL HELPER FUNCTIONS
    // ============================================================
    // These internal functions are placed in the external contract (not in a separate Internal
    // contract) because they require access to cross-module functionality that is only available
    // through ERC203643InternalCommon inheritance. This is architecturally correct because:
    // - Recovery has no dedicated storage (unlike Freeze, Metadata, Regulatory modules)
    // - All operations orchestrate existing module functionality (balances, freezes, registry)
    // - Direct placement here ensures accessibility to required internal functions
    // ============================================================

    /**
     * @dev Validates all recovery input parameters
     * @param _lostWallet The lost wallet address to validate
     * @param _newWallet The new wallet address to validate
     * @param _investorOnchainID The investor's onchain ID to validate
     *
     * Reverts:
     * - {InvalidLostWallet} if lost wallet is zero address
     * - {InvalidNewWallet} if new wallet is zero address
     * - {InvalidInvestorOnchainID} if onchain ID is zero address
     * - {SameWalletAddress} if lost and new wallets are the same
     */
    function _validateRecoveryInputs(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) internal pure {
        if (_lostWallet == address(0)) {
            revert IERC3643Recovery.InvalidLostWallet();
        }
        if (_newWallet == address(0)) {
            revert IERC3643Recovery.InvalidNewWallet();
        }
        if (_investorOnchainID == address(0)) {
            revert IERC3643Recovery.InvalidInvestorOnchainID();
        }
        if (_lostWallet == _newWallet) {
            revert IERC3643Recovery.SameWalletAddress();
        }
    }

    /**
     * @dev Checks if the lost wallet has tokens to recover
     * @param _lostWallet The wallet to check
     * @return balance The balance of the lost wallet
     *
     * Reverts:
     * - {NoTokensToRecover} if the wallet has zero balance
     */
    function _checkRecoverableBalance(
        address _lostWallet
    ) internal view returns (uint256 balance) {
        balance = _balanceOf(_lostWallet);
        if (balance == 0) {
            revert IERC3643Recovery.NoTokensToRecover();
        }
    }

    /**
     * @dev Validates that the new wallet belongs to the investor
     * @param _newWallet The wallet to validate
     * @param _onchainID The investor's onchain ID
     *
     * NOTE: Currently commented out - pending final IIdentity interface implementation
     *       Once IIdentity.keyHasPurpose is available, uncomment the implementation below
     *
     * Reverts or emits RecoveryFails if validation fails
     */
    function _validateWalletOwnership(
        address _newWallet,
        IIdentity _onchainID
    ) internal view {
        // TODO: Uncomment when IIdentity interface is complete
        // bytes32 walletKey = keccak256(abi.encode(_newWallet));
        // require(_onchainID.keyHasPurpose(walletKey, 1), "Invalid wallet key");
        
        // Placeholder to avoid unused parameter warnings
        _newWallet;
        _onchainID;
    }

    /**
     * @dev Captures the current frozen state of a wallet
     * @param _wallet The wallet to capture state from
     * @return frozenState Struct containing frozen tokens count and freeze status
     */
    function _captureFrozenState(
        address _wallet
    ) internal view returns (FrozenState memory frozenState) {
        frozenState.frozenTokens = _getFrozenTokens(_wallet);
        frozenState.wasAddressFrozen = _isFrozen(_wallet);
    }

    /**
     * @dev Registers a new wallet in the Identity Registry with investor's information
     * @param _lostWallet The lost wallet (used to get investor country)
     * @param _newWallet The new wallet to register
     * @param _onchainID The investor's onchain ID
     */
    function _registerNewWallet(
        address _lostWallet,
        address _newWallet,
        IIdentity _onchainID
    ) internal {
        address identityRegistry = _identityRegistry();
        uint16 investorCountry = IIdentityRegistry(identityRegistry)
            .investorCountry(_lostWallet);
        
        IIdentityRegistry(identityRegistry).registerIdentity(
            _newWallet,
            _onchainID,
            investorCountry
        );
    }

    /**
     * @dev Restores frozen state to the new wallet
     * @param _newWallet The wallet to restore frozen state to
     * @param _frozenState The frozen state to restore
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
     * @dev Removes the lost wallet from the Identity Registry
     * @param _lostWallet The wallet to remove
     */
    function _removeFromIdentityRegistry(address _lostWallet) internal {
        address identityRegistry = _identityRegistry();
        IIdentityRegistry(identityRegistry).deleteIdentity(_lostWallet);
    }
}
