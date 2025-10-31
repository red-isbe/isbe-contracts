// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title DID Registry Query Interface (read-only)
/// @notice Non-breaking extension surface intended for Diamond Facet composition.
///         Provides single-call helpers to resolve an address' DID and check membership
///         against a caller-supplied set of DID hashes.
/// @dev This interface does NOT modify the original IDidRegistry. It is designed
///      to be implemented by a dedicated facet that reads from the existing
///      DidDocumentDetailed storage slot.
interface IDidRegistryQuery {
    function isKnownDid(address account) external view returns (bool);

    /// @notice Resolve the DID of an invocation address and return its did
    /// @param account EOA or contract address associated to a verification method in the DID Registry
    /// @return did The DID string if found, otherwise bytes32(0)
    function didOf(address account) external view returns (bytes32 did);
}
