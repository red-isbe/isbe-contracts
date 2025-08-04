// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20CappedInternal} from './cap/ERC20CappedInternal.sol';
import {ERC20SnapshotInternal} from './snapshot/ERC20SnapshotInternal.sol';
import {ERC203643ExtendedInternal} from '../../erc3643/token/modules/203643extended/ERC203643ExtendedInternal.sol';
import {ERC20Internal} from '../ERC20Internal.sol';

/// @title ERC20InternalCommon
/// @notice This abstract contract puts together all ERC20 internal logic.
abstract contract ERC20InternalCommon is
    ERC20SnapshotInternal,
    ERC20CappedInternal,
    ERC203643ExtendedInternal
{
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Internal, ERC20SnapshotInternal) {
        ERC20SnapshotInternal._beforeTokenTransfer(from, to, amount);
    }

    function _mint(
        address account,
        uint256 amount
    ) internal virtual override(ERC20CappedInternal, ERC20Internal) {
        ERC20CappedInternal._mint(account, amount);
    }

    function _setName(
        string memory _newName
    ) internal virtual override(ERC203643ExtendedInternal,ERC20Internal) {
        ERC203643ExtendedInternal._setName(_newName);
    }

    function _setSymbol(
        string memory _newSymbol
    ) internal virtual override(ERC203643ExtendedInternal,ERC20Internal) {
        ERC203643ExtendedInternal._setSymbol(_newSymbol);
    }

}
