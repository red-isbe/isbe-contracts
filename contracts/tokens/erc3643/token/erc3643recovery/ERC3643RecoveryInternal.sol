// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Recovery} from './IERC3643Recovery.sol';
import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';
import {IIdentity} from '../../../../identity/IIdentity.sol';

/**
 * @title ERC3643RecoveryInternal
 * @notice Internal contract for managing ERC-3643 recovery functionality.
 * @dev Provides internal functions for token recovery from lost wallets.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643RecoveryInternal is ERC203643InternalCommon {
    /**
     * @dev Struct to hold frozen state information
     */
    struct FrozenState {
        uint256 frozenTokens;
        bool wasAddressFrozen;
    }

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
