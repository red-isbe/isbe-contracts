// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC3643MetadataInternal} from './erc3643/token/erc3643metadata/ERC3643MetadataInternal.sol';
import {ERC3643FreezeInternal} from './erc3643/token/erc3643freeze/ERC3643FreezeInternal.sol';
import {ERC3643RegulatoryInternal} from './erc3643/token/erc3643regulatory/ERC3643RegulatoryInternal.sol';

import {ERC20CappedInternal} from './erc20/extensions/cap/ERC20CappedInternal.sol';
import {ERC20SnapshotInternal} from './erc20/extensions/snapshot/ERC20SnapshotInternal.sol';
import {ERC20Internal} from './erc20/ERC20Internal.sol';

/// @title ERC3643InternalCommon
/// @notice Aggregates all ERC-3643 internal modules into a unified internal base.

// solhint-disable-next-line no-empty-blocks
abstract contract ERC203643InternalCommon is
    ERC20SnapshotInternal,
    ERC20CappedInternal,
    ERC3643MetadataInternal,
    ERC3643FreezeInternal,
    ERC3643RegulatoryInternal
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
