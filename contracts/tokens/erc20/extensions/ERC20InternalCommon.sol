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
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual override(ERC20Internal, ERC20SnapshotInternal) {
        ERC20SnapshotInternal._beforeTokenTransfer(_from, _to, _amount);
    }

    function _mint(
        address _account,
        uint256 _amount
    ) internal virtual override(ERC20CappedInternal, ERC20Internal) {
        ERC20CappedInternal._mint(_account, _amount);
    }

    

}
