// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ENS Text Record Resolver Interface
 * @notice Interface for managing arbitrary text metadata records within ENS nodes
 * @dev Provides functionality to store and retrieve key-value text data pairs for
 *      flexible metadata management and decentralised identity information storage
 * @author ISBE Development Team
 */
interface ITextResolver {
    /**
     * @notice Emitted when text data is associated with an ENS node and key
     * @param node The ENS node hash receiving the text data assignment
     * @param indexedKey The text data key indexed for efficient filtering
     * @param key The text data key identifier for metadata categorisation
     * @param value The text data value being stored for the specified key
     */
    event TextChanged(
        bytes32 indexed node,
        string indexed indexedKey,
        string key,
        string value
    );

    /**
     * @notice Associates text data with an ENS node using a specified key
     * @dev Stores arbitrary text metadata for flexible information management
     * @param node The ENS node hash to receive the text data assignment
     * @param key The text data key identifier for metadata categorisation
     * @param value The text data value to store for the specified key
     */
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external;

    /**
     * @notice Retrieves text data associated with an ENS node and key
     * @dev Returns the stored text metadata for the specified node and key combination
     * @param node The ENS node hash to query for text data
     * @param key The text data key identifier to retrieve the value for
     * @return textValue The text data value associated with the node and key
     */
    function text(
        bytes32 node,
        string calldata key
    ) external view returns (string memory textValue);
}
