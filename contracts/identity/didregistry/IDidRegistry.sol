// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidDocumentDetailed} from './IDidDocumentDetailed.sol';

/**
 * @title IDidRegistry
 * @notice DID registry contract interface for managing decentralised identities
 * @dev Extends detailed DID document functionality with version control
 * @author ISBE
 */
interface IDidRegistry is IDidDocumentDetailed {
    /**
     * @notice Emitted when registry version is updated
     * @param version New version number
     */
    event NewVersion(uint256 version);

    /**
     * @notice Initialises registry with trusted policy registry address
     * @param _tprAddress Trusted policy registry contract address
     * @param v Initial version number
     */
    function initialize(address _tprAddress, uint256 v) external;

    /**
     * @notice Verifies if address is authorised controller for DID
     * @param identifier DID identifier bytes
     * @param ctrl Controller address to validate
     * @return isController Whether address controls the DID
     */
    function checkController(
        bytes calldata identifier,
        address ctrl
    ) external view returns (bool isController);

    /**
     * @notice Gets current registry version number
     * @return currentVersion The active version
     */
    function version() external view returns (uint256 currentVersion);
}
