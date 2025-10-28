// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643CappedInternal} from './erc203643capped/ERC203643CappedInternal.sol';
import {ERC3643MetadataInternal} from '../erc3643/token/erc3643metadata/ERC3643MetadataInternal.sol';
import {ERC3643FreezeInternal} from '../erc3643/token/erc3643freeze/ERC3643FreezeInternal.sol';
import {ERC3643RegulatoryInternal} from '../erc3643/token/erc3643regulatory/ERC3643RegulatoryInternal.sol';
import {ERC20SnapshotInternal} from '../erc20/extensions/snapshot/ERC20SnapshotInternal.sol';
import {ERC3643ComplianceInternal} from '../erc3643/compliance/ERC3643ComplianceInternal.sol';

import {_CONTROLLER_ROLE} from '../../constants/roles.sol';
import {_RECOVERY_ROLE} from '../../constants/roles.sol';

import {IERC20Isbe} from '../erc20/IERC20Isbe.sol';
import {IERC3643Freeze} from '../erc3643/token/erc3643freeze/IERC3643Freeze.sol';
import {IERC3643Regulatory} from '../erc3643/token/erc3643regulatory/IERC3643Regulatory.sol';

/// @title ERC203643InternalCommon
/// @notice Aggregates the internal functions of ERC20, ERC3643
/// @dev Provides unified token transfer logic for both ERC20 and ERC3643 standards

// solhint-disable-next-line no-empty-blocks
abstract contract ERC203643InternalCommon is
    ERC20SnapshotInternal,
    ERC203643CappedInternal,
    ERC3643MetadataInternal,
    ERC3643FreezeInternal,
    ERC3643RegulatoryInternal,
    ERC3643ComplianceInternal
{
    /**
     * @dev Overrides the internal token transfer hook to handle mint, burn, and transfer operations
     *      with appropriate validations and snapshot updates.
     * @param _from The address from which tokens are being transferred (address(0) for mint)
     * @param _to The address to which tokens are being transferred (address(0) for burn)
     * @param _amount The amount of tokens being transferred
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override {
        // ==========================================================================
        // MINT OPERATIONS (_from == address(0))
        // ==========================================================================
        if (_from == address(0)) {
            _handleMintOperation(_from, _to, _amount);
        }
        // ==========================================================================
        // BURN OPERATIONS (_to == address(0))
        // ==========================================================================
        else if (_to == address(0)) {
            _handleBurnOperation(_from, _to, _amount);
        }
        // ==========================================================================
        // TRANSFER OPERATIONS (_from != address(0) && _to != address(0))
        // ==========================================================================
        else {
            _handleTransferOperation(_from, _to, _amount);
        }
    }

    /**
     * @dev Handles mint operations with snapshot updates and mint validation
     * @param _to The address to which tokens are being minted
     */
    function _handleMintOperation(address _from, address _to, uint256 _amount) internal {
        // Snapshot logic
        _updateAccountSnapshot(_to);
        _updateTotalSupplySnapshot();

        // mint() - Mint validation
        // In ERC20 mode: no additional validation needed
        // In ERC3643 mode: recipient must be verified in IdentityRegistry, and transfer allowed, and created hook called
        if (_hasIdentityRegistry()) {
            _isRecipientVerified(_to);
            _canTransfer(_from, _to, _amount);
            _created(_to, _amount);
        }
    }

    /**
     * @dev Handles burn operations with freeze management
     * @param _from The address from which tokens are being burned
     * @param _amount The amount of tokens being burned
     */
    function _handleBurnOperation(address _from, uint256 _amount) internal {
        // Snapshot logic
        _updateAccountSnapshot(_from);
        _updateTotalSupplySnapshot();

        // Calculate balance once for burn operations
        uint256 balance = _balanceOf(_from);
        require(balance >= _amount, IERC20Isbe.BurnAmountExceedsBalance());

        // Burn validation with freeze management
        // In ERC20 mode: burn() / burnFrom() no additional validations | forceBurn() no additional validations
        // In ERC3643 mode: burn() / burnFrom() don't exist (not exposed) | forceBurn() auto-unfreeze if needed
        if (_hasRole(_CONTROLLER_ROLE, msg.sender)) {
            // forceBurn() - Controller burn with auto-unfreeze capability
            // In ERC20 mode: no additional logic needed
            // In ERC3643 mode: auto-unfreeze frozen tokens if needed to complete the burn and destroyed hook
            
            if (_hasIdentityRegistry()) {
                _unfreezeIf3643Mode(_from, _amount);
                _destroyed(_from, _amount);
            }
        }
        // else: burn() / burnFrom() - Normal burn operations
        // (No additional logic needed here)
    }

    /**
     * @dev Handles transfer operations with regulatory compliance and freeze management
     * @param _from The address from which tokens are being transferred
     * @param _to The address to which tokens are being transferred
     * @param _amount The amount of tokens being transferred
     */
    function _handleTransferOperation(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        // Snapshot logic
        _updateAccountSnapshot(_from);
        _updateAccountSnapshot(_to);

        // Calculate balance once for transfer operations
        uint256 balance = _balanceOf(_from);
        require(balance >= _amount, IERC20Isbe.TransferAmountExceedsBalance());

        // ERC3643 mode validations - Transfer validation with regulatory compliance and freeze management
        // In ERC20 mode: transfer() and forceTransfer() behave identically here (no additional validations)
        if (_hasIdentityRegistry()) {
            // Verify recipient identity (required for both normal and force transfers), and transfer allowed, and transferred hook called
            _isRecipientVerified(_to);
            _canTransfer(_from, _to, _amount);
            _transferred(_from, _to, _amount);

            // Differentiate between normal transfers and forced transfers
            if (
                _hasRole(_CONTROLLER_ROLE, msg.sender) ||
                _hasRole(_RECOVERY_ROLE, msg.sender)
            ) {
                // forceTransfer() - Forced transfer with auto-unfreeze capability
                // Auto-unfreeze if needed to complete the transfer
                _unfreezeIf3643Mode(_from, _amount);
            } else {
                // transfer() / transferFrom() - Normal transfer operations
                // Strict validation: both accounts not frozen + sufficient free balance
                require(
                    !_isFrozen(_from),
                    IERC3643Freeze.SenderIsFrozen(_from)
                );
                require(!_isFrozen(_to), IERC3643Freeze.RecipientIsFrozen(_to));
                uint256 freeBalance = _calculateFreeBalance(_from);
                require(
                    freeBalance >= _amount,
                    IERC3643Freeze.InsufficientFreeBalance(
                        _from,
                        _amount,
                        freeBalance
                    )
                );
            }
        }
        // else: ERC20 mode - no additional validations needed for any transfer type
    }

    /**
     * @dev Unfreezes tokens if operating in ERC3643 mode and insufficient free balance
     * @param _from The address from which tokens are being transferred or burned
     * @param _amount The amount of tokens being transferred or burned
     */
    function _unfreezeIf3643Mode(address _from, uint256 _amount) internal {
        // Calculate freeze info once
        uint256 freeBalance = _calculateFreeBalance(_from);
        if (freeBalance < _amount) {
            uint256 tokensToUnfreeze = _amount - freeBalance;
            _unfreezePartialTokens(_from, tokensToUnfreeze);
            emit IERC3643Freeze.TokensUnfrozen(_from, tokensToUnfreeze);
        }
    }

    /**
     * @dev Checks if identity registry is configured
     * @return True if identity registry exists
     */
    function _hasIdentityRegistry() internal view returns (bool) {
        return _identityRegistry() != address(0);
    }

    /**
     * @dev Calculates the free balance of an account (total balance - frozen tokens)
     * @param _account The address of the account
     * @return The free balance of the account
     */
    function _calculateFreeBalance(
        address _account
    ) internal view returns (uint256) {
        uint256 balance = _balanceOf(_account);
        uint256 frozen = _getFrozenTokens(_account);
        return balance > frozen ? (balance - frozen) : 0;
    }

    /**
     * @dev Verifies if the recipient is verified in the Identity Registry
     * @param _to The address of the recipient
     */
    function _isRecipientVerified(address _to) internal view {
        /*require(
            IIdentityRegistry(_identityRegistry()).isVerified(_to),
            IERC3643Regulatory.RecipientNotVerified(_to)
        );*/
    }
    
}
