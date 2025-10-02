// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC3643InternalCommon} from '../ERC3643InternalCommon.sol';
import {IERC3643Control} from './IERC3643Control.sol';
import {_TOKEN_AGENT_ROLE} from '../../../../constants/roles.sol';

import {IIdentityRegistry} from '../../identityregistry/IIdentityRegistry.sol';
import {IERC20Isbe} from '../../../erc20/IERC20Isbe.sol';
import {IERC3643Freeze} from '../erc3643freeze/IERC3643Freeze.sol';

/**
 * @title ERC3643Control
 * @notice External contract implementing ERC-3643 control operations (forced transfers, mint, burn).
 * @dev Provides public methods to manage balances under regulatory rules.
 *      Applies access control, validation, and emits events.
 */
abstract contract ERC3643Control is IERC3643Control, ERC3643InternalCommon {
    /**
     * @notice Forces a token transfer from `_from` to `_to`.
     * @dev Restricted to token agent.
     *      Requires `_to` to be a verified address in the IdentityRegistry.
     *      If `_from` lacks enough free (unfrozen) balance but has sufficient total
     *      balance, it automatically unfreezes the missing portion to complete the transfer.
     *
     *      Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_from`.
     *      Emits a {Transfer} event via {_transfer}.
     *
     * @param _from   The address to debit tokens from.
     * @param _to     The address to credit tokens to (must be verified).
     * @param _amount The number of tokens to transfer.
     * @return success `true` if the transfer succeeds, otherwise reverts.
     */
    function forcedTransfer(
        address _from,
        address _to,
        uint256 _amount
    )
        external
        override
        onlyRole(_TOKEN_AGENT_ROLE)
        whenNotPaused
        returns (bool success)
    {
        uint256 balanceOfFrom = _balanceOf(_from);
        require(
            balanceOfFrom >= _amount,
            IERC20Isbe.TransferAmountExceedsBalance()
        );

        // 1) Destinatario debe estar verificado
        require(
            IIdentityRegistry(_identityRegistry()).isVerified(_to),
            IERC3643Control.RecipientNotVerified(_to)
        );

        // 2) Si no hay free balance suficiente, se descongela lo necesario
        uint256 frozen = _getFrozenTokens(_from);
        uint256 freeBalance = balanceOfFrom > frozen
            ? (balanceOfFrom - frozen)
            : 0;
        if (freeBalance < _amount) {
            uint256 tokensToUnfreeze = _amount - freeBalance;
            _unfreezePartialTokens(_from, tokensToUnfreeze);
            emit IERC3643Freeze.TokensUnfrozen(_from, tokensToUnfreeze);
        }

        // 3) Transferencia forzada
        _transfer(_from, _to, _amount);
        return true;
    }

    /**
     *  @dev mint tokens on a wallet
     *  Improved version of default mint method. Tokens can be minted
     *  to an address if only it is a verified address as per the security token.
     *  @param _to Address to mint the tokens to.
     *  @param _amount Amount of tokens to mint.
     *  This function can only be called by a wallet set as agent of the token
     *  emits a `Transfer` event
     */
    function mint(
        address _to,
        uint256 _amount
    ) external override onlyRole(_TOKEN_AGENT_ROLE) whenNotPaused {
        // 1) Destinatario debe estar verificado (asumes que identityRegistry está configurado)
        require(
            IIdentityRegistry(_identityRegistry()).isVerified(_to),
            IERC3643Control.RecipientNotVerified(_to)
        );

        // 3) Mint (emite Transfer(0x0, _to, _amount) desde internals)
        _mint(_to, _amount);
    }

    /**
     * @notice Burn tokens from a wallet.
     * @dev Restricted to token agent.
     *      If `_userAddress` lacks enough free balance but has sufficient total balance,
     *      the missing portion is automatically unfrozen to complete the burn.
     *
     *      Emits a {TokensUnfrozen} event if `_amount` exceeds the free balance of `_userAddress`.
     *      Emits a {Transfer} event to 0x0 via {_burn}.
     *
     * @param _userAddress The address from which tokens will be burned.
     * @param _amount      The number of tokens to burn.
     */
    function burn(
        address _userAddress,
        uint256 _amount
    ) external override onlyRole(_TOKEN_AGENT_ROLE) whenNotPaused {
        uint256 balanceOfUser = _balanceOf(_userAddress);
        require(
            balanceOfUser >= _amount,
            IERC20Isbe.BurnAmountExceedsBalance()
        );

        // 1) Cálculo del free balance
        uint256 frozen = _getFrozenTokens(_userAddress);
        uint256 freeBalance = balanceOfUser > frozen
            ? (balanceOfUser - frozen)
            : 0;

        // 2) Si no hay free balance suficiente, se descongela lo necesario
        if (freeBalance < _amount) {
            uint256 tokensToUnfreeze = _amount - freeBalance;
            _unfreezePartialTokens(_userAddress, tokensToUnfreeze);
            emit IERC3643Freeze.TokensUnfrozen(_userAddress, tokensToUnfreeze);
        }

        // 3) Burn (emite Transfer hacia 0x0)
        _burn(_userAddress, _amount);
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
        interfaces_[--interfacesLength] = type(IERC3643Control).interfaceId;
    }
}
