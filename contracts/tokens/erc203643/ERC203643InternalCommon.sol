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

// solhint-disable-next-line no-empty-blocks
abstract contract ERC203643InternalCommon is
    ERC20SnapshotInternal,
    ERC203643CappedInternal,
    ERC3643MetadataInternal,
    ERC3643FreezeInternal,
    ERC3643RegulatoryInternal
{
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override {
        // === VARIABLES COMUNES ===
        uint256 balanceOfFrom;
        uint256 frozen;
        uint256 freeBalance;
        bool hasIdentityRegistry = _identityRegistry() != address(0);
        bool hasControllerRole = _hasRole(_CONTROLLER_ROLE, msg.sender);
        bool hasRecoveryRole = _hasRole(_RECOVERY_ROLE, msg.sender);

        // ==========================================================================
        // MINT OPERATIONS (_from == address(0))
        // ==========================================================================
        if (_from == address(0)) {
            // Snapshot logic
            _updateAccountSnapshot(_to);
            _updateTotalSupplySnapshot();

            // mint() - Mint validation
            // In ERC20 mode: no additional validation needed
            // In ERC3643 mode: recipient must be verified in IdentityRegistry
            if (hasIdentityRegistry) {
                require(
                    IIdentityRegistry(_identityRegistry()).isVerified(_to),
                    IERC3643Regulatory.RecipientNotVerified(_to)
                );
            }
        }
        // ==========================================================================
        // BURN OPERATIONS (_to == address(0))
        // ==========================================================================
        else if (_to == address(0)) {
            // Snapshot logic
            _updateAccountSnapshot(_from);
            _updateTotalSupplySnapshot();

            // Calculate balance once for burn operations
            balanceOfFrom = _balanceOf(_from);
            require(
                balanceOfFrom >= _amount,
                IERC20Isbe.BurnAmountExceedsBalance()
            );

            // Burn validation with freeze management
            // In ERC20 mode: burn() / burnFrom() no additional validations | forceBurn() no additional validations
            // In ERC3643 mode: burn() / burnFrom() don't exist (not exposed) | forceBurn() auto-unfreeze if needed
            if (hasControllerRole) {
                // forceBurn() - Controller burn with auto-unfreeze capability
                // In ERC20 mode: frozen = 0, so freeBalance = balanceOfFrom (no unfreeze needed)
                // In ERC3643 mode: auto-unfreeze frozen tokens if needed to complete the burn
                frozen = _getFrozenTokens(_from);
                freeBalance = balanceOfFrom > frozen
                    ? (balanceOfFrom - frozen)
                    : 0;

                if (freeBalance < _amount) {
                    uint256 tokensToUnfreeze = _amount - freeBalance;
                    _unfreezePartialTokens(_from, tokensToUnfreeze);
                    emit IERC3643Freeze.TokensUnfrozen(_from, tokensToUnfreeze);
                }
            }
            // else: burn() / burnFrom() - Normal burn operations
            // (No additional logic needed here)
        }
        // ==========================================================================
        // TRANSFER OPERATIONS (_from != address(0) && _to != address(0))
        // ==========================================================================
        else {
            // Snapshot logic
            _updateAccountSnapshot(_from);
            _updateAccountSnapshot(_to);

            // Calculate balance once for transfer operations
            balanceOfFrom = _balanceOf(_from);
            require(
                balanceOfFrom >= _amount,
                IERC20Isbe.TransferAmountExceedsBalance()
            );

            // ERC3643 mode validations - Transfer validation with regulatory compliance and freeze management
            // In ERC20 mode: transfer() and forceTransfer() behave identically here (no additional validations)
            if (hasIdentityRegistry) {
                // Verify recipient identity (required for both normal and force transfers)
                require(
                    IIdentityRegistry(_identityRegistry()).isVerified(_to),
                    IERC3643Regulatory.RecipientNotVerified(_to)
                );

                // Calculate freeze info once
                frozen = _getFrozenTokens(_from);
                freeBalance = balanceOfFrom > frozen
                    ? (balanceOfFrom - frozen)
                    : 0;

                if (hasControllerRole || hasRecoveryRole) {
                    // forceTransfer() - Forced transfer with auto-unfreeze capability
                    // Auto-unfreeze if needed to complete the transfer
                    if (freeBalance < _amount) {
                        uint256 tokensToUnfreeze = _amount - freeBalance;
                        _unfreezePartialTokens(_from, tokensToUnfreeze);
                        emit IERC3643Freeze.TokensUnfrozen(
                            _from,
                            tokensToUnfreeze
                        );
                    }
                } else {
                    // transfer() / transferFrom() - Normal transfer operations
                    // Strict validation: both accounts not frozen + sufficient free balance
                    require(
                        !_isFrozen(_from),
                        IERC3643Freeze.SenderIsFrozen(_from)
                    );
                    require(
                        !_isFrozen(_to),
                        IERC3643Freeze.RecipientIsFrozen(_to)
                    );
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
    }
}
