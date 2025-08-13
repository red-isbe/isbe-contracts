// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC721Internal} from '../../ERC721Internal.sol';
import {IERC721Snapshot} from './IERC721Snapshot.sol';
import {Arrays} from '@openzeppelin/contracts/utils/Arrays.sol';
import {Counters} from '@openzeppelin/contracts/utils/Counters.sol';
import {_ERC721_SNAPSHOT_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/**
 * @title ERC721SnapshotInternal
 * @notice Internal implementation of an ERC721 token with snapshot functionality.
 *         Provides the core logic for recording and querying historical balances,
 *         ownership, and total supply at specific snapshot IDs.
 * @dev This abstract contract:
 *      - Implements methods for creating snapshots and retrieving values at specific snapshot IDs.
 *      - Extends the _beforeTokenTransfer and _afterTokenTransfer hooks to update snapshots for
 *      balance and ownership changes.
 *      - Uses an internal ERC721SnapshotStorage struct to manage snapshot data efficiently.
 *      - Should be inherited and extended by contracts requiring snapshot functionality.
 *      Includes safeguards for invalid or non-existent snapshot IDs using custom errors.
 */
abstract contract ERC721SnapshotInternal is ERC721Internal {
    using Arrays for uint256[];
    using Counters for Counters.Counter;

    struct Snapshots {
        uint256[] ids;
        uint256[] values;
    }

    struct TokenOwnerSnapshots {
        uint256[] ids;
        address[] owners;
    }

    struct ERC721SnapshotStorage {
        mapping(address => Snapshots) accountBalanceSnapshots;
        Snapshots totalSupplySnapshots;
        mapping(uint256 => TokenOwnerSnapshots) tokenOwnerSnapshots;
        Counters.Counter currentSnapshotId;
    }

    function _snapshot() internal virtual returns (uint256) {
        ERC721SnapshotStorage storage $ = _erc721SnapshotStorage();
        $.currentSnapshotId.increment();
        uint256 currentId = _getCurrentSnapshotId();
        emit IERC721Snapshot.Snapshot(currentId);
        return currentId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // Update snapshots for balances and ownership before transfer
        if (from != address(0)) {
            _updateAccountSnapshot(from);
        }
        if (to != address(0)) {
            _updateAccountSnapshot(to);
        }
        _updateTokenOwnerSnapshot(tokenId);
        _updateTotalSupplySnapshot();
    }

    function _balanceOfAt(
        address account,
        uint256 snapshotId
    ) internal view returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _erc721SnapshotStorage().accountBalanceSnapshots[account]
        );
        return snapshotted ? value : _balanceOf(account);
    }

    function _totalSupplyAt(
        uint256 snapshotId
    ) internal view returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _erc721SnapshotStorage().totalSupplySnapshots
        );
        return snapshotted ? value : _totalSupply();
    }

    function _ownerOfAt(
        uint256 tokenId,
        uint256 snapshotId
    ) internal view returns (address) {
        (bool snapshotted, address owner) = _ownerAt(
            snapshotId,
            _erc721SnapshotStorage().tokenOwnerSnapshots[tokenId]
        );
        return snapshotted ? owner : _ownerOf(tokenId);
    }

    function _getCurrentSnapshotId() internal view virtual returns (uint256) {
        return _erc721SnapshotStorage().currentSnapshotId.current();
    }

    function _valueAt(
        uint256 snapshotId,
        Snapshots storage snapshots
    ) internal view returns (bool, uint256) {
        _checkUintIsNotZero(snapshotId);
        _checkSnapshotIdExists(snapshotId);

        uint256 index = snapshots.ids.findUpperBound(snapshotId);
        return
            (index == snapshots.ids.length)
                ? (false, 0)
                : (true, snapshots.values[index]);
    }

    function _ownerAt(
        uint256 snapshotId,
        TokenOwnerSnapshots storage snapshots
    ) internal view returns (bool, address) {
        _checkUintIsNotZero(snapshotId);
        _checkSnapshotIdExists(snapshotId);

        uint256 index = snapshots.ids.findUpperBound(snapshotId);
        return
            (index == snapshots.ids.length)
                ? (false, address(0))
                : (true, snapshots.owners[index]);
    }

    function _checkSnapshotIdExists(uint256 snapshotId) internal view {
        require(
            snapshotId <= _getCurrentSnapshotId(),
            IERC721Snapshot.NonExistentSnapshotId()
        );
    }

    function _updateAccountSnapshot(address account) private {
        _updateSnapshot(
            _erc721SnapshotStorage().accountBalanceSnapshots[account],
            _balanceOf(account)
        );
    }

    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(
            _erc721SnapshotStorage().totalSupplySnapshots,
            _totalSupply()
        );
    }

    function _updateTokenOwnerSnapshot(uint256 tokenId) private {
        _updateOwnerSnapshot(
            _erc721SnapshotStorage().tokenOwnerSnapshots[tokenId],
            _ownerOf(tokenId)
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

    function _updateOwnerSnapshot(
        TokenOwnerSnapshots storage snapshots,
        address currentOwner
    ) private {
        uint256 currentId = _getCurrentSnapshotId();
        if (_lastSnapshotId(snapshots.ids) < currentId) {
            snapshots.ids.push(currentId);
            snapshots.owners.push(currentOwner);
        }
    }

    function _lastSnapshotId(
        uint256[] storage ids
    ) private view returns (uint256) {
        return ids.length == 0 ? 0 : ids[ids.length - 1];
    }

    function _erc721SnapshotStorage()
        private
        pure
        returns (ERC721SnapshotStorage storage storage_)
    {
        bytes32 position = _ERC721_SNAPSHOT_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
