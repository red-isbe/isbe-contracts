// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from './ERC20InternalCommon.sol';
import {IERC20Snapshot} from './IERC20Snapshot.sol';

/**
 * @title ERC20Snapshot
 * @notice Implementation of the ERC20 snapshot functionality.
 *         This contract allows querying the balance of accounts and the total supply at specific snapshot IDs.
 *         It builds upon the internal logic provided in `ERC20SnapshotInternal`.
 * @dev This contract implements two public view functions:
 *      - `balanceOfAt`: Retrieves account balances at a specific snapshot ID.
 *      - `totalSupplyAt`: Retrieves the total token supply at a specific snapshot ID.
 *      Snapshot data is efficiently managed by leveraging the internal `_valueAt` function and
 *      `ERC20SnapshotInternal`'s storage mechanisms. If no snapshot exists for the given ID, these
 *      functions fall back to returning the current state values.
 */
abstract contract ERC20Snapshot is IERC20Snapshot, ERC20InternalCommon {
    function snapshot() public virtual override {
        _snapshot();
    }

    /**
     * @dev Retrieves the balance of `account` at the time `snapshotId` was created.
     */
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

    /**
     * @dev Retrieves the total supply at the time `snapshotId` was created.
     */
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
