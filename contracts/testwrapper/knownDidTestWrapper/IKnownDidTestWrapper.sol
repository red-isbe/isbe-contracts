// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IKnownDidTestWrapper
 * @notice Interface for the KnownDidTestWrapper contract
 */
interface IKnownDidTestWrapper {
    /**
     * @notice Emitted when a DID is successfully verified
     * @param account The address that was verified to have a registered DID
     */
    event DidVerified(address account);

    /**
     * @notice Tests the onlyKnownDid modifier
     * @dev Reverts with AddressNotKnown if the caller doesn't have a registered DID
     */
    function testOnlyKnownDid() external;
}
