// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Recovery} from './IERC3643Recovery.sol';
import {_RECOVERY_ROLE} from '../../../../constants/roles.sol';
import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';
import {IIdentity} from '../../../../identity/IIdentity.sol';

/**
 * @title ERC3643Recovery
 * @notice External contract implementing ERC-3643 recovery functionality.
 * @dev Allows authorized agents to recover tokens from lost wallets to new verified wallets.
 */
abstract contract ERC3643Recovery is IERC3643Recovery, ERC203643InternalCommon {
    
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
        
        // Validate input addresses
        require(_lostWallet != address(0), 'Invalid lost wallet');
        require(_newWallet != address(0), 'Invalid new wallet');
        require(_investorOnchainID != address(0), 'Invalid investor onchain ID');
        require(_lostWallet != _newWallet, 'Lost and new wallet cannot be the same');
        
        // Check if lost wallet has any balance to recover
        uint256 lostWalletBalance = _balanceOf(_lostWallet);
        require(lostWalletBalance != 0, 'no tokens to recover');
        
        // Validate that the new wallet belongs to the investor (key validation)
        IIdentity onchainID = IIdentity(_investorOnchainID);
        
        /* esto ver como queda al final
        bytes32 walletKey = keccak256(abi.encode(_newWallet));
        if (!onchainID.keyHasPurpose(walletKey, 1)) {
            emit RecoveryFails(_lostWallet, _newWallet, _investorOnchainID);
            return false;
        }
        */
        
        // Store frozen state and tokens before transfer
        uint256 frozenTokens = _getFrozenTokens(_lostWallet);
        bool wasAddressFrozen = _isFrozen(_lostWallet);
        
        // Get country information and register new wallet in Identity Registry
        address identityRegistry = _identityRegistry();
        uint16 investorCountry = IIdentityRegistry(identityRegistry).investorCountry(_lostWallet);
        IIdentityRegistry(identityRegistry).registerIdentity(_newWallet, onchainID, investorCountry);
        
        // Transfer all tokens from lost wallet to new wallet
        _transfer(_lostWallet, _newWallet, lostWalletBalance);
        
        // Restore frozen state on new wallet
        if (frozenTokens > 0) {
            _freezePartialTokens(_newWallet, frozenTokens);
        }
        if (wasAddressFrozen) {
            _setAddressFrozen(_newWallet, true);
        }
        
        // Remove lost wallet from Identity Registry
        IIdentityRegistry(identityRegistry).deleteIdentity(_lostWallet);
        
        // Emit success event
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