// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './ERC20InternalCommon.sol';
import {IERC20Snapshot} from './IERC20Snapshot.sol';

/// @title ERC20Snapshot
/// @notice Implements snapshot mechanism
/// @dev Inherits from IERC20Snapshot and ERC20InternalCommon
abstract contract ERC20Snapshot is IERC20Snapshot, ERC20InternalCommon {
    function snapshot() public virtual override {
        _snapshot();
    }

    function balanceOfAt(
        address account,
        uint256 snapshotId
    ) public view virtual override returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _erc20SnapshotStorage().accountBalanceSnapshots[account]
        );

        return snapshotted ? value : _balanceOf(account);
    }

    function totalSupplyAt(
        uint256 snapshotId
    ) public view virtual override returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _erc20SnapshotStorage().totalSupplySnapshots
        );

        return snapshotted ? value : _totalSupply();
    }
}
