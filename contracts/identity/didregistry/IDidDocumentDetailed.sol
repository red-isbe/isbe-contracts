// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Detailed DID Document Management Interface
 * @notice Interface for comprehensive decentralised identifier document management with
 *         verification methods and temporal relationships
 * @dev Provides advanced functionality for DID document creation, updates, retrieval,
 *      and historical queries with support for verification methods and relationships
 * @author ISBE Development Team
 */
interface IDidDocumentDetailed {
    /**
     * @notice Structure representing a verification method for cryptographic operations
     * @param publicKey The public key bytes for cryptographic verification
     * @param isSecp256k1 Boolean indicating if the key uses secp256k1 elliptic curve
     * @param revoked Boolean flag indicating if the verification method is revoked
     */
    struct VMethod {
        bytes publicKey;
        bool isSecp256k1;
        bool revoked;
    }

    /**
     * @notice Structure representing a verification relationship with temporal constraints
     * @param name The name identifier for the verification relationship type
     * @param vMethodId The verification method identifier associated with relationship
     * @param notBefore Unix timestamp when the relationship becomes valid
     * @param notAfter Unix timestamp when the relationship expires
     * @param indexDid The DID index reference for efficient relationship queries
     */
    struct VRelationship {
        string name;
        string vMethodId;
        uint256 notBefore;
        uint256 notAfter;
        uint256 indexDid;
    }

    /**
     * @notice Emitted when a new DID document is inserted into the registry
     * @param did The decentralised identifier being registered
     * @param baseDocument The base DID document content in JSON format
     * @param vMethodId The initial verification method identifier
     * @param publicKey The initial public key for cryptographic verification
     * @param isSecp256k1 Boolean indicating secp256k1 elliptic curve usage
     * @param notBefore Unix timestamp when the DID becomes valid
     * @param notAfter Unix timestamp when the DID expires
     */
    event DidDocumentInserted(
        string did,
        string baseDocument,
        string vMethodId,
        bytes publicKey,
        bool isSecp256k1,
        uint256 notBefore,
        uint256 notAfter
    );

    /**
     * @notice Emitted when a DID's base document is updated
     * @param did The decentralised identifier being updated
     * @param baseDocument The new base document content in JSON format
     */
    event BaseDocumentUpdated(string did, string baseDocument);

    /**
     * @notice Inserts a new DID document with initial verification method
     * @dev Creates a complete DID document entry with cryptographic verification capability
     * @param did The decentralised identifier to register
     * @param baseDocument The base DID document content in standardised JSON format
     * @param vMethodId The unique identifier for the initial verification method
     * @param publicKey The public key bytes for cryptographic operations
     * @param isSecp256k1 Boolean flag indicating secp256k1 elliptic curve usage
     * @param notBefore Unix timestamp when the DID document becomes active
     * @param notAfter Unix timestamp when the DID document expires
     * @return success Boolean indicating successful document insertion
     */
    function insertDidDocument(
        string memory did,
        string memory baseDocument,
        string memory vMethodId,
        bytes memory publicKey,
        bool isSecp256k1,
        uint256 notBefore,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Updates the base document content for an existing DID
     * @dev Modifies the core document whilst preserving verification methods and
     *      relationships
     * @param did The decentralised identifier to update
     * @param baseDocument The new base document content in JSON format
     * @return success Boolean indicating successful document update
     */
    function updateBaseDocument(
        string memory did,
        string memory baseDocument
    ) external returns (bool success);

    /**
     * @notice Retrieves paginated list of registered DIDs
     * @dev Returns paginated results for efficient handling of large DID registries
     * @param page The page number to retrieve (zero-based indexing)
     * @param pageSize The maximum number of DIDs per page
     * @return items Array of DID strings for the requested page
     * @return total Total number of registered DIDs in the registry
     * @return howMany Number of DID items returned in current page
     * @return prev Previous page number (zero if no previous page exists)
     * @return next Next page number (zero if no next page exists)
     */
    function getDids(
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            string[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Retrieves complete DID document with current verification methods
     * @dev Returns the most recent state of the DID document including all active
     *      verification methods and relationships
     * @param did The decentralised identifier to query
     * @return baseDocument The base DID document content in JSON format
     * @return controllers Array of controller identifiers with management permissions
     * @return vMethodIds Array of verification method identifiers
     * @return vMethods Array of VMethod structures containing verification details
     * @return vRelationships Array of VRelationship structures for temporal links
     */
    function getDidDocument(
        string memory did
    )
        external
        view
        returns (
            string memory baseDocument,
            string[] memory controllers,
            string[] memory vMethodIds,
            VMethod[] memory vMethods,
            VRelationship[] memory vRelationships
        );

    /**
     * @notice Retrieves historical DID document state at specific timestamp
     * @dev Returns the DID document state as it existed at the specified point in time,
     *      including verification methods and relationships valid at that moment
     * @param did The decentralised identifier to query historically
     * @param timestamp Unix timestamp for historical state retrieval
     * @return baseDocument The base document content at the specified timestamp
     * @return controllers Array of controllers valid at the specified timestamp
     * @return vMethodIds Array of verification method IDs active at timestamp
     * @return vMethods Array of VMethod structures valid at the timestamp
     * @return vRelationships Array of VRelationship structures active at timestamp
     */
    function getDidDocumentByTimestamp(
        string memory did,
        uint256 timestamp
    )
        external
        view
        returns (
            string memory baseDocument,
            string[] memory controllers,
            string[] memory vMethodIds,
            VMethod[] memory vMethods,
            VRelationship[] memory vRelationships
        );
}
