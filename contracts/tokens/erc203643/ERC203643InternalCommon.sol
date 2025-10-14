// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643CappedInternal} from './erc203643capped/ERC203643CappedInternal.sol';

import {ERC3643MetadataInternal} from '../erc3643/token/erc3643metadata/ERC3643MetadataInternal.sol';
import {ERC3643FreezeInternal} from '../erc3643/token/erc3643freeze/ERC3643FreezeInternal.sol';
import {ERC3643RegulatoryInternal} from '../erc3643/token/erc3643regulatory/ERC3643RegulatoryInternal.sol';

import {ERC20SnapshotInternal} from '../erc20/extensions/snapshot/ERC20SnapshotInternal.sol';

import {IERC20Isbe} from '../erc20/IERC20Isbe.sol';
import {IERC3643Freeze} from '../erc3643/token/erc3643freeze/IERC3643Freeze.sol';

import {_CONTROLLER_ROLE} from '../../constants/roles.sol';
import {IIdentityRegistry} from '../erc3643/identityregistry/IIdentityRegistry.sol';
import {IERC203643Controller} from './erc203643controller/IERC203643Controller.sol';

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
        // === SNAPSHOT LOGIC (from ERC20SnapshotInternal) ===
        if (_from == address(0)) {
            // mint
            _updateAccountSnapshot(_to);
            _updateTotalSupplySnapshot();
        } else if (_to == address(0)) {
            // burn
            _updateAccountSnapshot(_from);
            _updateTotalSupplySnapshot();
        } else {
            // transfer
            _updateAccountSnapshot(_from);
            _updateAccountSnapshot(_to);
        }

        // === ERC203643 BUSINESS LOGIC ===
        // === MINT (_from == address(0)) ===
        if (_from == address(0)) {
            if (_identityRegistry() != address(0)) {
                require(
                    IIdentityRegistry(_identityRegistry()).isVerified(_to),
                    IERC203643Controller.RecipientNotVerified(_to)
                );
            }
        }

        // === BURN (_to == address(0)) ===
        else if (_to == address(0)) {
            uint256 balanceOfFrom = _balanceOf(_from);
            require(
                balanceOfFrom >= _amount,
                IERC20Isbe.BurnAmountExceedsBalance()
            );

            // Solo los controladores pueden hacer burn con descongelamiento automático
            if (_hasRole(_CONTROLLER_ROLE, msg.sender)) {
                uint256 frozen = _getFrozenTokens(_from);
                uint256 freeBalance = balanceOfFrom > frozen
                    ? (balanceOfFrom - frozen)
                    : 0;

                if (freeBalance < _amount) {
                    uint256 tokensToUnfreeze = _amount - freeBalance;
                    _unfreezePartialTokens(_from, tokensToUnfreeze);
                    emit IERC3643Freeze.TokensUnfrozen(_from, tokensToUnfreeze);
                }
            }
        }

        // === TRANSFER (_from != address(0) && _to != address(0)) ===
        else {
            uint256 balanceOfFrom = _balanceOf(_from);
            require(
                balanceOfFrom >= _amount,
                IERC20Isbe.TransferAmountExceedsBalance()
            );

            // 1. Si hay identityRegistry configurado (ERC3643), verificar destinatario
            if (_identityRegistry() != address(0)) {
                require(
                    IIdentityRegistry(_identityRegistry()).isVerified(_to),
                    IERC203643Controller.RecipientNotVerified(_to)
                );

                // 2. Verificar si es transferencia forzada (por controlador)
                bool isForcedTransfer = _hasRole(_CONTROLLER_ROLE, msg.sender);

                uint256 frozen = _getFrozenTokens(_from);
                uint256 freeBalance = balanceOfFrom > frozen
                    ? (balanceOfFrom - frozen)
                    : 0;

                if (isForcedTransfer) {
                    // Transferencia forzada: descongelar si es necesario
                    if (freeBalance < _amount) {
                        uint256 tokensToUnfreeze = _amount - freeBalance;
                        _unfreezePartialTokens(_from, tokensToUnfreeze);
                        emit IERC3643Freeze.TokensUnfrozen(
                            _from,
                            tokensToUnfreeze
                        );
                    }
                }

                // Transferencia normal: verificar que el destinatario no esté congelado
                // y que haya suficiente balance libre
                /*comentado para evitar error de compilacion hasta definir custom error
                    else {
                    require(!_isFrozen(_to), 'Recipient is frozen');
                    require(
                        freeBalance >= _amount,
                        'Insufficient free balance'
                    );
                    }
                    */
            }
        }
    }
}
