// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from '../ERC20.sol';
import {
    _ERC20_CAPPED_STORAGE_POSITION
} from '../../../constants/storagePositions.sol';
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
abstract contract ERC20SnapshotInternal is ERC20, IERC20Snapshot {
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
     * @dev Creates a new snapshot and returns its snapshot id.
     *
     * Emits a {Snapshot} event that contains the same id.
     *
     * {_snapshot} is `internal` and you have to decide how to expose it externally. Its usage may be restricted to a
     * set of accounts, for example using {AccessControl}, or it may be open to the public.
     *
     * [WARNING]
     * ====
     * While an open way of calling {_snapshot} is required for certain trust minimization mechanisms such as forking,
     * you must consider that it can potentially be used by attackers in two ways.
     *
     * First, it can be used to increase the cost of retrieval of values from snapshots, although it will grow
     * logarithmically thus rendering this attack ineffective in the long term. Second, it can be used to target
     * specific accounts and increase the cost of ERC20 transfers for them, in the ways specified in the Gas Costs
     * section above.
     *
     * We haven't measured the actual numbers; if this is something you're interested in please reach out to us.
     * ====
     */
    function _snapshot() internal virtual returns (uint256) {
        _erc20SnapshotStorage().currentSnapshotId.increment();

        uint256 currentId = _getCurrentSnapshotId();
        emit Snapshot(currentId);
        return currentId;
    }

    // Update balance and/or total supply snapshots before the values are modified. This is implemented
    // in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

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

    /**
     * @dev Get the current snapshotId
     */
    function _getCurrentSnapshotId() internal view virtual returns (uint256) {
        return _erc20SnapshotStorage().currentSnapshotId.current();
    }

    function _valueAt(
        uint256 snapshotId,
        Snapshots storage snapshots
    ) internal view returns (bool, uint256) {
        require(snapshotId > 0, SnapshotWithIdZero());
        require(snapshotId <= _getCurrentSnapshotId(), NonExistentSnapshotId());

        // When a valid snapshot is queried, there are three possibilities:
        //      a) The queried value was not modified after the snapshot was taken.
        //         Therefore, a snapshot entry was never created for this id,
        //         and all stored snapshot ids are smaller than the requested one.
        //         The value that corresponds to this id is the current one.
        //
        //      b) The queried value was modified after the snapshot was taken.
        //         Therefore, there will be an entry with the requested id,
        //         and its value is the one to return.
        //
        //      c) More snapshots were created after the requested one,
        //         and the queried value was later modified. There will be no entry
        //         for the requested id: the value that corresponds to it is that of
        //         the smallest snapshot id that is larger than the requested one.
        //
        // In summary, we need to find an element in an array, returning the index
        // of the smallest value that is larger if it is not found, unless said
        // value doesn't exist (e.g., when all values are smaller).
        // Arrays.findUpperBound does exactly this.

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
            balanceOf(account)
        );
    }

    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(
            _erc20SnapshotStorage().totalSupplySnapshots,
            totalSupply()
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
