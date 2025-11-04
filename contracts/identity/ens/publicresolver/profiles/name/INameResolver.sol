// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ENS Name Resolver Interface
 * @notice Interface for managing reverse DNS resolution within the Ethereum Name Service
 * @dev Provides functionality to associate human-readable names with ENS nodes for
 *      reverse lookup operations as specified in EIP-181
 * @author ISBE Development Team
 */
interface INameResolver {
    /**
     * @notice Emitted when a name is associated with an ENS node
     * @param node The ENS node hash receiving the new name association
     * @param name The human-readable name being assigned to the node
     */
    event NameChanged(bytes32 indexed node, string name);

    /**
     * @notice Associates a human-readable name with an ENS node for reverse resolution
     * @dev Enables reverse DNS lookups by storing the canonical name for a given node
     * @param node The ENS node hash to receive the name association
     * @param newName The human-readable name to associate with the specified node
     */
    function setName(bytes32 node, string calldata newName) external;

    /**
     * @notice Retrieves the human-readable name associated with an ENS node
     * @dev Returns the canonical name for reverse DNS resolution as defined in EIP-181
     * @param node The ENS node hash to query for its associated name
     * @return associatedName The human-readable name linked to the specified node
     */
    function name(
        bytes32 node
    ) external view returns (string memory associatedName);
}
