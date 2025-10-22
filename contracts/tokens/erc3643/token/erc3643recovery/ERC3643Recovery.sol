// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC3643RecoveryInternal} from './ERC3643RecoveryInternal.sol';
import {IERC3643Recovery} from './IERC3643Recovery.sol';
import {_RECOVERY_ROLE} from '../../../../constants/roles.sol';
import {IIdentity} from '../../../../identity/IIdentity.sol';

/**
 * @title ERC3643Recovery
 * @notice External contract implementing ERC-3643 recovery functionality.
 * @dev Allows authorized agents to recover tokens from lost wallets to new verified wallets.
 */
abstract contract ERC3643Recovery is IERC3643Recovery, ERC3643RecoveryInternal {
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
}
