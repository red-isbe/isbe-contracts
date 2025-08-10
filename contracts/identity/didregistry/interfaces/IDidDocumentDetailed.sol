// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Decentralised Identity Document Management Interface
 * @notice Core interface for comprehensive DID document operations and lifecycle management
 * @dev Provides functionality for creating, updating, and retrieving decentralised identifier
 *      documents with cryptographic verification methods. Supports temporal validity
 *      constraints and multiple elliptic curve algorithms for enhanced security
 * @author ISBE Development Team
 */
interface IDidDocumentDetailed {
    /**
     * @notice Enumeration of supported elliptic curve cryptographic algorithms
     * @param NONE No elliptic curve algorithm specified
     * @param SECP_256_K1 The secp256k1 elliptic curve used in Bitcoin and Ethereum
     * @param SECP_256_R1 The secp256r1 elliptic curve used in NIST standards
     */
    enum EllipticType {
        NONE,
        SECP_256_K1,
        SECP_256_R1
    }

    /**
     * @param publicKey The cryptographic public key material encoded as bytes
     * @param ellipticType The elliptic curve algorithm used for this verification method
     * @param revoked Whether this verification method has been permanently revoked
     */
    struct VMethod {
        bytes publicKey;
        EllipticType ellipticType;
        bool revoked;
    }

    /**
     * @param name The human-readable name identifying this verification relationship
     * @param vMethodId The unique identifier referencing the associated verification method
     * @param notBefore The timestamp before which this relationship is not valid
     * @param notAfter The timestamp after which this relationship expires
     * @param indexDid The numerical index of the DID within the registry
     */
    struct VRelationship {
        string name;
        string vMethodId;
        uint256 notBefore;
        uint256 notAfter;
        uint256 indexDid;
    }

    /**
     * @notice Emitted when the DID registry is initialised with cryptographic parameters
     * @param ellipticType The elliptic curve algorithm configured for the registry
     */
    event DiDRegistryInitialized(EllipticType ellipticType);

    /**
     * @notice Emitted when a new DID document is successfully inserted into the registry
     * @param did The decentralised identifier string that was registered
     * @param baseDocument The base JSON-LD document content for the DID
     * @param vMethodId The unique identifier for the initial verification method
     * @param publicKey The public key material for the initial verification method
     * @param ellipticType The elliptic curve algorithm used for the initial key
     * @param notBefore The timestamp before which the verification method is invalid
     * @param notAfter The timestamp after which the verification method expires
     */
    event DidDocumentInserted(
        string did,
        string baseDocument,
        string vMethodId,
        bytes publicKey,
        EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter
    );

    /**
     * @notice Emitted when the base document content of a DID is updated
     * @param did The decentralised identifier whose base document was modified
     * @param baseDocument The new base JSON-LD document content
     */
    event BaseDocumentUpdated(string did, string baseDocument);

    /**
     * @notice Thrown when an invalid or unsupported elliptic curve type is specified
     */
    error InvalidEllipticCurve();

    /**
     * @notice Thrown when the first public key does not match the configured network type
     * @param ellipticType The elliptic curve type that was provided but does not match
     */
    error FirstPublicKeyMustBeTheSameThanTheNetwork(EllipticType ellipticType);

    /**
     * @notice Thrown when attempting to register a DID that already exists in the registry
     * @param did The decentralised identifier string that already exists
     */
    error DidAlreadyExists(string did);

    /**
     * @notice Thrown when attempting to use a DID that not exists in the registry
     * @param did The decentralised identifier string that not exists
     */
    error DidNotExists(string did);

    /**
     * @notice Thrown when provided control bytes are malformed or invalid
     */
    error InvalidControlBytes();

    /**
     * @notice Thrown when public key length does not match expected format requirements
     */
    error InvalidPubKeyLength();

    /**
     * @notice Thrown when an unsupported verification method type is specified
     * @param method The verification method string that is not recognised
     */
    error InvalidVerificationMethod(string method);

    /**
     * @notice Initialises the DID registry with the specified elliptic curve configuration
     * @dev Sets the cryptographic parameters for the entire registry. Must be called once
     *      before any DID operations can be performed. Only valid elliptic curve types
     *      are accepted, excluding NONE which represents an invalid state
     * @param _ellipticType The elliptic curve algorithm to configure for this registry
     */
    function initializeDiDRegistry(EllipticType _ellipticType) external;

    /**
     * @notice Creates a new DID document with initial verification method
     * @dev Requires that the DID does not already exist in the registry. The initial
     *      verification method must use a supported elliptic curve algorithm
     * @param did The unique decentralised identifier string to register
     * @param baseDocument The base JSON-LD document content conforming to DID specification
     * @param vMethodId The unique identifier for the initial verification method
     * @param publicKey The cryptographic public key material encoded as bytes
     * @param ellipticType The elliptic curve algorithm for the verification method
     * @param notBefore The timestamp before which the verification method is not valid
     * @param notAfter The timestamp after which the verification method expires
     * @return success Whether the DID document insertion completed successfully
     */
    function insertDidDocument(
        string memory did,
        string memory baseDocument,
        string memory vMethodId,
        bytes memory publicKey,
        EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Updates the base document content for an existing DID
     * @dev Only authorised controllers can modify the base document. The DID must exist
     *      and be in an active state for updates to be permitted
     * @param did The decentralised identifier whose base document will be updated
     * @param baseDocument The new base JSON-LD document content
     * @return success Whether the base document update completed successfully
     */
    function updateBaseDocument(
        string memory did,
        string memory baseDocument
    ) external returns (bool success);

    /**
     * @notice Retrieves a paginated list of all registered DIDs in the system
     * @dev Returns DIDs in registration order with pagination support for large datasets
     * @param page The zero-based page number for pagination
     * @param pageSize The maximum number of DIDs to return per page
     * @return items Array of decentralised identifier strings for the requested page
     * @return total The total number of DIDs registered in the system
     * @return howMany The actual number of DIDs returned in this response
     * @return prev The previous page number, or current page if no previous page exists
     * @return next The next page number, or current page if no next page exists
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
     * @notice Retrieves complete DID document details for a specified identifier
     * @dev Returns all components of the DID document including controllers, verification
     *      methods, and verification relationships in their current state
     * @param did The decentralised identifier to retrieve document details for
     * @return baseDocument The base JSON-LD document content
     * @return controllers Array of controller identifier strings
     * @return vMethodIds Array of verification method identifier strings
     * @return vMethods Array of verification method structures with cryptographic details
     * @return vRelationships Array of verification relationship structures
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
     * @notice Retrieves DID document state as it existed at a specific timestamp
     * @dev Provides historical view of DID document configuration, useful for audit
     *      trails and temporal verification of identity claims
     * @param did The decentralised identifier to retrieve historical state for
     * @param timestamp The specific timestamp to query document state at
     * @return baseDocument The base JSON-LD document content at the specified time
     * @return controllers Array of controller identifiers active at the timestamp
     * @return vMethodIds Array of verification method identifiers active at the timestamp
     * @return vMethods Array of verification method structures valid at the timestamp
     * @return vRelationships Array of verification relationships active at the timestamp
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
