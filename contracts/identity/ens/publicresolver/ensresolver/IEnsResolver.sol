// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ENS} from '../../ensregistry/ENS.sol';

interface IEnsResolver {
    /**
     * @notice Emitted when an operator is granted or revoked comprehensive permissions
     * @param owner The address granting or revoking operator permissions
     * @param operator The address receiving or losing operator permissions
     * @param approved Boolean indicating whether operator permissions are granted
     */
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /**
     * @notice Emitted when a delegate is approved or revoked for specific node operations
     * @param owner The address granting or revoking delegate permissions
     * @param node The ENS node hash for which delegation is being managed
     * @param delegate The address receiving or losing delegate permissions
     * @param approved Boolean indicating whether delegate permissions are granted
     */
    event Approved(
        address owner,
        bytes32 indexed node,
        address indexed delegate,
        bool indexed approved
    );

    /**
     * @notice Emitted when the public resolver is initialised with ENS registry reference
     * @param _ens The address of the ENS registry contract being associated
     */
    event PublicResolverInitialized(address _ens);

    /**
     * @notice Raised when an unauthorised address attempts to modify a node
     * @dev Triggered when the caller lacks ownership, operator, or delegate permissions for the node
     * @param node The node hash that the caller attempted to modify
     * @param caller The address that made the unauthorised attempt
     */
    error NotAuthorisedForNode(bytes32 node, address caller);

    /**
     * @notice Initialises the public resolver with ENS registry reference
     * @dev Establishes the connection to the ENS registry for ownership verification
     * @param _ens The ENS registry contract address for resolver integration
     */
    function initializePublicResolver(ENS _ens) external;

    /**
     * @notice Grants or revokes operator permissions for all caller's ENS nodes
     * @dev Provides comprehensive access control for resolver operations across all nodes
     * @param operator The address to grant or revoke operator permissions for
     * @param approved Boolean indicating whether to grant or revoke permissions
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @notice Grants or revokes delegate permissions for a specific ENS node
     * @dev Enables fine-grained access control for individual node operations
     * @param node The ENS node hash to manage delegate permissions for
     * @param delegate The address to grant or revoke delegate permissions for
     * @param approved Boolean indicating whether to grant or revoke permissions
     */
    function approve(bytes32 node, address delegate, bool approved) external;

    /**
     * @notice Checks if an address has operator permissions for another account
     * @dev Verifies comprehensive operator status across all nodes for an account
     * @param account The account address to check operator permissions for
     * @param operator The address to verify as an operator
     * @return isApproved Boolean indicating if operator permissions are granted
     */
    function isApprovedForAll(
        address account,
        address operator
    ) external view returns (bool isApproved);

    /**
     * @notice Checks if an address has delegate permissions for a specific node
     * @dev Verifies node-specific delegate status for targeted access control
     * @param owner The owner address to check delegate permissions for
     * @param node The ENS node hash to verify delegate permissions against
     * @param delegate The address to verify as a delegate
     * @return isApproved Boolean indicating if delegate permissions are granted
     */
    function isApprovedFor(
        address owner,
        bytes32 node,
        address delegate
    ) external view returns (bool isApproved);
}
