// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// =======================
// Imports
// =======================

import {ERC203643CappedInternal} from './erc203643capped/ERC203643CappedInternal.sol';
import {ERC3643FreezeInternal} from '../erc3643/token/erc3643freeze/ERC3643FreezeInternal.sol';
import {ERC20SnapshotInternal} from '../erc20/extensions/snapshot/ERC20SnapshotInternal.sol';
import {ERC3643ComplianceInternal} from '../erc3643/compliance/ERC3643ComplianceInternal.sol';
import {BasicWhitelistInternal} from '../../access/whitelist/basic/BasicWhitelistInternal.sol';
import {IBasicWhitelist} from '../../access/whitelist/basic/IBasicWhitelist.sol';
import {ICompliance} from '../erc3643/compliance/ICompliance.sol';
import {_CONTROLLER_ROLE} from '../../constants/roles.sol';
import {_RECOVERY_ROLE} from '../../constants/roles.sol';
import {_COMPLIANCE_ROLE} from '../../constants/roles.sol';

import {IERC20Isbe} from '../erc20/IERC20Isbe.sol';
import {IERC3643Freeze} from '../erc3643/token/erc3643freeze/IERC3643Freeze.sol';

/// @title ERC203643InternalCommon
/// @notice Aggregates the internal functions of ERC20 and ERC3643 standards.
/// @dev Provides unified token transfer logic for both ERC20 and ERC3643 standards
abstract contract ERC203643InternalCommon is
    ERC20SnapshotInternal,
    ERC203643CappedInternal,
    ERC3643FreezeInternal,
    ERC3643ComplianceInternal,
    BasicWhitelistInternal
{
    // =======================
    // Transfer Hooks
    // =======================

    /**
     * @dev Internal hook called before any token transfer, mint, or burn.
     *      Handles mint, burn, and transfer operations with validations and snapshot updates.
     * @param _from The address from which tokens are being transferred (address(0) for mint).
     * @param _to The address to which tokens are being transferred (address(0) for burn).
     * @param _amount The amount of tokens being transferred.
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override {
        // Mint operation
        if (_from == address(0)) {
            return _handleMintOperation(_to, _amount);
        }
        // Burn operation
        if (_to == address(0)) {
            return _handleBurnOperation(_from, _amount);
        }
        // Transfer operation
        _handleTransferOperation(_from, _to, _amount);
    }

    // =======================
    // Mint Logic
    // =======================

    /**
     * @dev Handles mint operations, including snapshot updates and compliance checks.
     * @param _to The address receiving the minted tokens.
     * @param _amount The amount of tokens being minted.
     *
     * In ERC-3643 mode, compliance hooks may restrict minting.
     * In ERC-20 mode, these hooks are inert and always pass.
     */
    function _handleMintOperation(address _to, uint256 _amount) internal {
        _checkNotWhitelisted(_to);
        _updateAccountSnapshot(_to);
        _updateTotalSupplySnapshot();

        // Compliance hooks (ERC-3643 mode only). By pass by _COMPLIANCE_ROLE.
        if (_hasRole(_COMPLIANCE_ROLE, _msgSender())) {
            return; // Coverage tracking: explicit handling to ensure instrumentation detection
        }
        require(
            _canTransfer(address(0), _to, _amount),
            ICompliance.MintViolatesComplianceRules()
        );
        _created(_to, _amount);
    }

    // =======================
    // Burn Logic
    // =======================

    /**
     * @dev Handles burn operations, including snapshot updates, freeze management, and compliance hooks.
     * @param _from The address from which tokens are being burned.
     * @param _amount The amount of tokens being burned.
     *
     * In ERC-3643 mode, auto-unfreeze may be triggered and compliance hooks may restrict burning.
     * In ERC-20 mode, these hooks are inert and always pass.
     */
    function _handleBurnOperation(address _from, uint256 _amount) internal {
        _updateAccountSnapshot(_from);
        _updateTotalSupplySnapshot();

        uint256 balance = _balanceOf(_from);
        require(balance >= _amount, IERC20Isbe.BurnAmountExceedsBalance());

        _unfreezeIf3643Mode(_from, _amount);

        // Compliance hooks (ERC-3643 mode only). By pass by _COMPLIANCE_ROLE.
        bool hasComplianceRole = _hasRole(_COMPLIANCE_ROLE, _msgSender());

        if (hasComplianceRole) {
            // Compliance role bypasses the _destroyed hook
            // This is intentional for compliance contract operations
            return;
        }

        // Normal path: call _destroyed for compliance validation
        _destroyed(_from, _amount);
    }

    // =======================
    // Transfer Logic
    // =======================

    /**
     * @dev Handles transfer operations, including snapshot updates, compliance, and freeze checks.
     * @param _from The address from which tokens are being transferred.
     * @param _to The address to which tokens are being transferred.
     * @param _amount The amount of tokens being transferred.
     *
     * In ERC-3643 mode, compliance and freeze hooks may restrict transfers.
     * In ERC-20 mode, these hooks are inert and always pass.
     */
    function _handleTransferOperation(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(_isWhitelisted(_to), IBasicWhitelist.NotWhitelisted(_to));
        _updateAccountSnapshot(_from);
        _updateAccountSnapshot(_to);

        _checkTransferAmountExceedsBalance(_balanceOf(_from), _amount);

        // Compliance hooks (ERC-3643 mode only). By pass by _COMPLIANCE_ROLE.
        if (!_hasRole(_COMPLIANCE_ROLE, _msgSender())) {
            require(
                _canTransfer(_from, _to, _amount),
                ICompliance.TransferViolatesComplianceRules()
            );
            _transferred(_from, _to, _amount);
        }

        // Forced transfer logic for controller/recovery roles
        if (
            _hasRole(_CONTROLLER_ROLE, _msgSender()) ||
            _hasRole(_RECOVERY_ROLE, _msgSender())
        ) {
            _unfreezeIf3643Mode(_from, _amount);
        } else {
            // Normal transfer: enforce freeze checks (ERC-3643 mode only)
            require(!_isFrozen(_from), IERC3643Freeze.SenderIsFrozen(_from));
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

    // =======================
    // Freeze Logic
    // =======================

    /**
     * @dev Unfreezes tokens if operating in ERC-3643 mode and insufficient free balance.
     * @param _from The address from which tokens are being transferred or burned.
     * @param _amount The amount of tokens being transferred or burned.
     */
    function _unfreezeIf3643Mode(address _from, uint256 _amount) internal {
        uint256 freeBalance = _calculateFreeBalance(_from);
        if (freeBalance >= _amount) {
            return; // Coverage tracking: explicit handling to ensure instrumentation detection
        } else {
            uint256 tokensToUnfreeze = _amount - freeBalance;
            _unfreezePartialTokens(_from, tokensToUnfreeze);
            emit IERC3643Freeze.TokensUnfrozen(_from, tokensToUnfreeze);
        }
    }

    // =======================
    // Utility
    // =======================

    /**
     * @dev Calculates the free balance of an account (total balance minus frozen tokens).
     * @param _account The address of the account.
     * @return The free balance of the account.
     */
    function _calculateFreeBalance(
        address _account
    ) internal view returns (uint256) {
        uint256 balance = _balanceOf(_account);
        uint256 frozen = _getFrozenTokens(_account);
        return balance > frozen ? (balance - frozen) : 0;
    }
}
