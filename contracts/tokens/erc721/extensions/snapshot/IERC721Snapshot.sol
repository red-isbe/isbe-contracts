// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC721Snapshot
 * @notice Interface for ERC721 contracts with snapshot functionality.
 *         Enables recording and querying historical ownership, balances, and total supply at specific snapshot IDs.
 * @dev Provides mechanisms to:
 *      - Record snapshots of ownership, balances, and total supply.
 *      - Retrieve an account's balance or the total token supply at a specific snapshot ID.
 *      - Retrieve the owner of a token at a specific snapshot ID.
 *      - Emit events for created snapshots.
 *      This interface should be implemented by ERC721 contracts that require snapshot tracking.
 */
interface IERC721Snapshot {
    /**
     * @notice Emitted when a new snapshot is created.
     * @dev The event is triggered in the `_snapshot` function and corresponds to the given `id`.
     * @param id The ID of the created snapshot.
     */
    event Snapshot(uint256 id);

    /**
     * @notice Error indicating that the snapshot ID is invalid because it is zero.
     * @dev Snapshot IDs must always start from 1 or higher, and ID 0 is reserved as invalid.
     */
    error SnapshotWithIdZero();

    /**
     * @notice Error indicating that the given snapshot ID does not exist.
     * @dev This is triggered when querying a nonexistent or invalid snapshot ID.
     */
    error NonExistentSnapshotId();

    /**
     * @notice Creates a new snapshot.
     * @dev Should be called to record the current state of balances, ownership, and total supply.
     *      Emits a `Snapshot` event.
     */
    function snapshot() external;

    /**
     * @notice Retrieves the balance of an account at the specified snapshot ID.
     * @dev Fetches the balance recorded in the snapshot for a given account.
     *      Will revert if the snapshot ID is invalid or does not exist.
     * @param account The address of the account whose balance is being queried.
     * @param snapshotId The ID of the snapshot to query.
     * @return The balance of the specified account at the queried snapshot ID.
     */
    function balanceOfAt(
        address account,
        uint256 snapshotId
    ) external view returns (uint256);

    /**
     * @notice Retrieves the total token supply at the specified snapshot ID.
     * @dev Fetches the total supply recorded in the snapshot at the given ID.
     *      Will revert if the snapshot ID is invalid or does not exist.
     * @param snapshotId The ID of the snapshot to query.
     * @return The total token supply at the queried snapshot ID.
     */
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256);

    /**
     * @notice Retrieves the owner of a token at the specified snapshot ID.
     * @dev Fetches the owner recorded in the snapshot for a given tokenId.
     *      Will revert if the snapshot ID is invalid or does not exist.
     * @param tokenId The ID of the token whose owner is being queried.
     * @param snapshotId The ID of the snapshot to query.
     * @return The owner of the specified token at the queried snapshot ID.
     */
    function ownerOfAt(
        uint256 tokenId,
        uint256 snapshotId
    ) external view returns (address);
}
