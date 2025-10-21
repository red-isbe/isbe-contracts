// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643CappedInternal} from './erc203643capped/ERC203643CappedInternal.sol';
import {ERC3643MetadataInternal} from '../erc3643/token/erc3643metadata/ERC3643MetadataInternal.sol';
import {ERC3643FreezeInternal} from '../erc3643/token/erc3643freeze/ERC3643FreezeInternal.sol';
import {ERC3643RegulatoryInternal} from '../erc3643/token/erc3643regulatory/ERC3643RegulatoryInternal.sol';
import {ERC20SnapshotInternal} from '../erc20/extensions/snapshot/ERC20SnapshotInternal.sol';

import {_CONTROLLER_ROLE} from '../../constants/roles.sol';
import {_RECOVERY_ROLE} from '../../constants/roles.sol';

import {IERC20Isbe} from '../erc20/IERC20Isbe.sol';
import {IERC3643Freeze} from '../erc3643/token/erc3643freeze/IERC3643Freeze.sol';
import {IIdentityRegistry} from '../erc3643/identityregistry/IIdentityRegistry.sol';
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
    ERC3643RegulatoryInternal
{
    /**
     * @dev Hook that is called before any token transfer
     * @param _from Address tokens are transferred from (0x0 for minting)
     * @param _to Address tokens are transferred to (0x0 for burning)
     * @param _amount Amount of tokens to transfer
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override {
        // Determine the type of operation
        if (_from == address(0)) {
            _handleMintOperation(_to);
        } else if (_to == address(0)) {
            _handleBurnOperation(_from, _amount);
        } else {
            _handleTransferOperation(_from, _to, _amount);
        }
    }

    /**
     * @dev Handles mint operations (when _from is address(0))
     * @param _to Recipient address
     */
    function _handleMintOperation(address _to) internal {
        // Update snapshots
        _updateAccountSnapshot(_to);
        _updateTotalSupplySnapshot();

        // Validate recipient in ERC3643 mode
        _validateRecipientIdentity(_to);
    }

    /**
     * @dev Handles burn operations (when _to is address(0))
     * @param _from Address to burn tokens from
     * @param _amount Amount to burn
     */
    function _handleBurnOperation(address _from, uint256 _amount) internal {
        // Update snapshots
        _updateAccountSnapshot(_from);
        _updateTotalSupplySnapshot();

        // Validate sufficient balance for burn
        _validateSufficientBalanceForBurn(_from, _amount);

        // Handle force burn with auto-unfreeze if caller is controller
        if (_isControllerOrRecovery()) {
            _handleForceBurnWithUnfreeze(_from, _amount);
        }
    }

    /**
     * @dev Handles transfer operations (when both _from and _to are non-zero)
     * @param _from Address to transfer from
     * @param _to Address to transfer to
     * @param _amount Amount to transfer
     */
    function _handleTransferOperation(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        // Update snapshots
        _updateAccountSnapshot(_from);
        _updateAccountSnapshot(_to);

        // Validate sufficient balance
        _validateSufficientBalance(_from, _amount);

        // Apply ERC3643 validations if identity registry is configured
        if (_hasIdentityRegistry()) {
            _validateERC3643Transfer(_from, _to, _amount);
        }
    }

    /**
     * @dev Validates ERC3643 transfer requirements
     * @param _from Address to transfer from
     * @param _to Address to transfer to
     * @param _amount Amount to transfer
     */
    function _validateERC3643Transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        // Recipient must be verified
        _validateRecipientIdentity(_to);

        // Check if this is a forced transfer by controller/recovery
        if (_isControllerOrRecovery()) {
            _handleForceTransferWithUnfreeze(_from, _amount);
        } else {
            _handleNormalTransferValidation(_from, _to, _amount);
        }
    }

    /**
     * @dev Handles normal transfer validation (non-forced)
     * @param _from Address to transfer from
     * @param _to Address to transfer to
     * @param _amount Amount to transfer
     */
    function _handleNormalTransferValidation(
        address _from,
        address _to,
        uint256 _amount
    ) internal view {
        // Both sender and recipient must not be frozen
        require(!_isFrozen(_from), IERC3643Freeze.SenderIsFrozen(_from));
        require(!_isFrozen(_to), IERC3643Freeze.RecipientIsFrozen(_to));

        // Sender must have sufficient free (unfrozen) balance
        uint256 freeBalance = _calculateFreeBalance(_from);
        require(
            freeBalance >= _amount,
            IERC3643Freeze.InsufficientFreeBalance(_from, _amount, freeBalance)
        );
    }

    /**
     * @dev Handles force burn with auto-unfreeze capability
     * @param _from Address to burn from
     * @param _amount Amount to burn
     */
    function _handleForceBurnWithUnfreeze(
        address _from,
        uint256 _amount
    ) internal {
        uint256 freeBalance = _calculateFreeBalance(_from);

        if (freeBalance < _amount) {
            _unfreezeTokensForOperation(_from, _amount, freeBalance);
        }
    }

    /**
     * @dev Handles force transfer with auto-unfreeze capability
     * @param _from Address to transfer from
     * @param _amount Amount to transfer
     */
    function _handleForceTransferWithUnfreeze(
        address _from,
        uint256 _amount
    ) internal {
        uint256 freeBalance = _calculateFreeBalance(_from);

        if (freeBalance < _amount) {
            _unfreezeTokensForOperation(_from, _amount, freeBalance);
        }
    }

    /**
     * @dev Unfreezes tokens to complete an operation
     * @param _from Address to unfreeze tokens for
     * @param _amount Total amount needed
     * @param _freeBalance Current free balance
     */
    function _unfreezeTokensForOperation(
        address _from,
        uint256 _amount,
        uint256 _freeBalance
    ) internal {
        uint256 tokensToUnfreeze = _amount - _freeBalance;
        _unfreezePartialTokens(_from, tokensToUnfreeze);
        emit IERC3643Freeze.TokensUnfrozen(_from, tokensToUnfreeze);
    }

    /**
     * @dev Validates that recipient is verified in identity registry
     * @param _to Recipient address to validate
     */
    function _validateRecipientIdentity(address _to) internal view {
        if (_hasIdentityRegistry()) {
            require(
                IIdentityRegistry(_identityRegistry()).isVerified(_to),
                IERC3643Regulatory.RecipientNotVerified(_to)
            );
        }
    }

    /**
     * @dev Validates that account has sufficient balance for transfer
     * @param _account Account to check
     * @param _amount Amount required
     */
    function _validateSufficientBalance(
        address _account,
        uint256 _amount
    ) internal view {
        uint256 balance = _balanceOf(_account);
        require(balance >= _amount, IERC20Isbe.TransferAmountExceedsBalance());
    }

    /**
     * @dev Validates that account has sufficient balance for burn
     * @param _account Account to check
     * @param _amount Amount required
     */
    function _validateSufficientBalanceForBurn(
        address _account,
        uint256 _amount
    ) internal view {
        uint256 balance = _balanceOf(_account);
        require(balance >= _amount, IERC20Isbe.BurnAmountExceedsBalance());
    }

    /**
     * @dev Checks if identity registry is configured
     * @return True if identity registry exists
     */
    function _hasIdentityRegistry() internal view returns (bool) {
        return _identityRegistry() != address(0);
    }

    /**
     * @dev Checks if caller has controller or recovery role
     * @return True if caller is controller or recovery
     */
    function _isControllerOrRecovery() internal view returns (bool) {
        return
            _hasRole(_CONTROLLER_ROLE, msg.sender) ||
            _hasRole(_RECOVERY_ROLE, msg.sender);
    }

    /**
     * @dev Calculates the free (unfrozen) balance for an account
     * @param _account The address to check
     * @return The amount of unfrozen tokens available for transfer
     */
    function _calculateFreeBalance(
        address _account
    ) internal view returns (uint256) {
        uint256 totalBalance = _balanceOf(_account);
        uint256 frozenTokens = _getFrozenTokens(_account);

        // If frozen tokens exceed total balance, free balance is zero
        if (frozenTokens >= totalBalance) {
            return 0;
        }

        // Otherwise, free balance is the difference
        return totalBalance - frozenTokens;
    }
}
