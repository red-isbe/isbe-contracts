// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Ethereum Name Service Registry Interface
 * @notice Core interface for managing decentralised domain name resolution and ownership
 * @dev Provides hierarchical domain management with resolver delegation and operator
 *      approval mechanisms for efficient name service operations
 * @author ISBE Development Team
 */
interface ENS {
    /**
     * @notice Emitted when ownership of a subnode is assigned to a new owner
     * @param node The parent node hash under which the subnode is created
     * @param label The keccak256 hash of the subnode label being assigned
     * @param owner The address receiving ownership of the new subnode
     */
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

    /**
     * @notice Emitted when node ownership is transferred to a new account
     * @param node The node hash being transferred to new ownership
     * @param owner The address receiving ownership of the node
     */
    event Transfer(bytes32 indexed node, address owner);

    /**
     * @notice Emitted when the resolver contract for a node is updated
     * @param node The node hash receiving the new resolver assignment
     * @param resolver The address of the new resolver contract
     */
    event NewResolver(bytes32 indexed node, address resolver);

    /**
     * @notice Emitted when the time-to-live value for a node is modified
     * @param node The node hash receiving the new TTL value
     * @param ttl The new time-to-live value in seconds for caching purposes
     */
    event NewTTL(bytes32 indexed node, uint64 ttl);

    /**
     * @notice Emitted when operator approval status changes for an owner
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
     * @notice Sets complete record information for a node in a single transaction
     * @dev Updates owner, resolver, and TTL atomically to maintain consistency
     * @param node The node hash to update with new record information
     * @param owner The address to assign as the new node owner
     * @param resolver The resolver contract address for handling node queries
     * @param ttl The time-to-live value in seconds for caching optimisation
     */
    function setRecord(
        bytes32 node,
        address owner,
        address resolver,
        uint64 ttl
    ) external;

    /**
     * @notice Creates a subnode with complete record information
     * @dev Combines subnode creation with record setting for efficiency
     * @param node The parent node hash under which to create the subnode
     * @param label The keccak256 hash of the subnode label
     * @param owner The address to assign as owner of the new subnode
     * @param resolver The resolver contract address for the new subnode
     * @param ttl The time-to-live value for the new subnode record
     */
    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner,
        address resolver,
        uint64 ttl
    ) external;

    /**
     * @notice Creates a new subnode and assigns ownership
     * @dev Requires caller to be authorised to modify the parent node
     * @param node The parent node hash under which to create the subnode
     * @param label The keccak256 hash of the subnode label
     * @param owner The address to receive ownership of the new subnode
     * @return subnodeHash The computed hash of the newly created subnode
     */
    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner
    ) external returns (bytes32 subnodeHash);

    /**
     * @notice Updates the resolver contract address for a node
     * @dev Requires caller to be the node owner or approved operator
     * @param node The node hash to update with a new resolver
     * @param resolver The address of the new resolver contract
     */
    function setResolver(bytes32 node, address resolver) external;

    /**
     * @notice Transfers ownership of a node to a new address
     * @dev Requires caller to be the current node owner or approved operator
     * @param node The node hash to transfer to new ownership
     * @param owner The address to receive ownership of the node
     */
    function setOwner(bytes32 node, address owner) external;

    /**
     * @notice Updates the time-to-live value for a node
     * @dev Affects caching behaviour for resolvers and clients
     * @param node The node hash to update with a new TTL value
     * @param ttl The new time-to-live value in seconds
     */
    function setTTL(bytes32 node, uint64 ttl) external;

    /**
     * @notice Grants or revokes operator permissions for all caller's nodes
     * @dev Allows operators to manage nodes on behalf of the owner
     * @param operator The address to grant or revoke operator permissions
     * @param approved Boolean indicating whether to grant or revoke permissions
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @notice Retrieves the current owner address of a node
     * @dev Returns the address with management rights for the specified node
     * @param node The node hash to query for ownership information
     * @return ownerAddress The address that owns the specified node
     */
    function owner(bytes32 node) external view returns (address ownerAddress);

    /**
     * @notice Retrieves the resolver contract address for a node
     * @dev Returns the contract responsible for resolving queries for this node
     * @param node The node hash to query for resolver information
     * @return resolverAddress The address of the node's resolver contract
     */
    function resolver(
        bytes32 node
    ) external view returns (address resolverAddress);

    /**
     * @notice Retrieves the time-to-live value for a node
     * @dev Returns the caching duration in seconds for the specified node
     * @param node The node hash to query for TTL information
     * @return ttlValue The time-to-live value in seconds
     */
    function ttl(bytes32 node) external view returns (uint64 ttlValue);

    /**
     * @notice Checks whether a record exists for the specified node
     * @dev Determines if a node has been registered in the ENS registry
     * @param node The node hash to check for existence
     * @return exists Boolean indicating whether the node record exists
     */
    function recordExists(bytes32 node) external view returns (bool exists);

    /**
     * @notice Checks if an operator is approved to manage all nodes for an owner
     * @dev Validates operator permissions for node management operations
     * @param owner The address that granted or may grant operator permissions
     * @param operator The address to check for operator approval status
     * @return isApproved Boolean indicating if operator is approved for all nodes
     */
    function isApprovedForAll(
        address owner,
        address operator
    ) external view returns (bool isApproved);
}
