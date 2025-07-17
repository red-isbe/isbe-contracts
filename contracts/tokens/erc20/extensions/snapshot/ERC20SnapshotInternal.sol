// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Internal} from '../../ERC20Internal.sol';
import {
    _ERC20_CAPPED_STORAGE_POSITION
} from '../../../../constants/storagePositions.sol';
import {IERC20Snapshot} from './IERC20Snapshot.sol';
import {Arrays} from '@openzeppelin/contracts/utils/Arrays.sol';
import {Counters} from '@openzeppelin/contracts/utils/Counters.sol';

/**
 * @title ERC20SnapshotInternal
 * @notice Internal implementation of an ERC20 token with snapshot functionality.
 *         This contract provides the core functionality for recording and querying historical
 *         balances and total supply at specific snapshot IDs.
 * @dev This abstract contract:
 *      - Implements methods for creating snapshots and retrieving values at specific snapshot IDs.
 *      - Extends the `_beforeTokenTransfer` hook to update snapshots for balance changes.
 *      - Uses an internal `ERC20SnapshotStorage` struct to manage snapshot data efficiently.
 *      - Should be inherited and extended by contracts requiring snapshot functionality.
 *      Includes safeguards for invalid or non-existent snapshot IDs using custom errors.
 */
abstract contract ERC20SnapshotInternal is ERC20Internal {
    // Inspired by Jordi Baylina's MiniMeToken to record historical balances:
    // https://github.com/Giveth/minime/blob/ea04d950eea153a04c51fa510b068b9dded390cb/contracts/MiniMeToken.sol
    using Arrays for uint256[];
    using Counters for Counters.Counter;

    /**
     * @notice Internal storage structure for managing snapshot metadata.
     * @dev Contains:
     *      - `accountBalanceSnapshots`: Snapshots of individual account balances.
     *      - `totalSupplySnapshots`: Snapshots of total token supply.
     *      - `currentSnapshotId`: A counter to maintain monotonically increasing snapshot IDs.
     */
    struct ERC20SnapshotStorage {
        mapping(address => Snapshots) accountBalanceSnapshots;
        Snapshots totalSupplySnapshots;
        // Snapshot ids increase monotonically, with the first value being 1. An id of 0 is invalid.
        Counters.Counter currentSnapshotId;
    }

    /**
     * @notice Internal struct to store snapshot data.
     * @dev Contains:
     *      - `ids`: An array of snapshot IDs.
     *      - `values`: An array of values corresponding to those snapshot IDs.
     *      These arrays are used to efficiently store and query snapshot values.
     */
    struct Snapshots {
        uint256[] ids;
        uint256[] values;
    }

    function _snapshot() internal virtual returns (uint256) {
        _erc20SnapshotStorage().currentSnapshotId.increment();

        uint256 currentId = _getCurrentSnapshotId();
        emit IERC20Snapshot.Snapshot(currentId);
        return currentId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 /*amount*/
    ) internal virtual override {
        if (from == address(0)) {
            // mint
            _updateAccountSnapshot(to);
            return _updateTotalSupplySnapshot();
        }
        if (to == address(0)) {
            // burn
            _updateAccountSnapshot(from);
            return _updateTotalSupplySnapshot();
        }
        // transfer
        _updateAccountSnapshot(from);
        _updateAccountSnapshot(to);
    }

    function _getCurrentSnapshotId() internal view virtual returns (uint256) {
        return _erc20SnapshotStorage().currentSnapshotId.current();
    }

    function _valueAt(
        uint256 snapshotId,
        Snapshots storage snapshots
    ) internal view returns (bool, uint256) {
        require(snapshotId > 0, IERC20Snapshot.SnapshotWithIdZero());
        require(
            snapshotId <= _getCurrentSnapshotId(),
            IERC20Snapshot.NonExistentSnapshotId()
        );

        uint256 index = snapshots.ids.findUpperBound(snapshotId);
        return
            (index == snapshots.ids.length)
                ? (false, 0)
                : (true, snapshots.values[index]);
    }

    function _erc20SnapshotStorage()
        internal
        pure
        returns (ERC20SnapshotStorage storage storage_)
    {
        bytes32 position = _ERC20_CAPPED_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

    function _updateAccountSnapshot(address account) private {
        _updateSnapshot(
            _erc20SnapshotStorage().accountBalanceSnapshots[account],
            _balanceOf(account)
        );
    }

    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(
            _erc20SnapshotStorage().totalSupplySnapshots,
            _totalSupply()
        );
    }

    function _updateSnapshot(
        Snapshots storage snapshots,
        uint256 currentValue
    ) private {
        uint256 currentId = _getCurrentSnapshotId();
        if (_lastSnapshotId(snapshots.ids) < currentId) {
            snapshots.ids.push(currentId);
            snapshots.values.push(currentValue);
        }
    }

    function _lastSnapshotId(
        uint256[] storage ids
    ) private view returns (uint256) {
        return ids.length == 0 ? 0 : ids[ids.length - 1];
    }
}
