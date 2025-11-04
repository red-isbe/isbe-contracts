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
     * @param NONE No elliptic curve algorithm specified - invalid for operations
     * @param SECP_256_K1 The secp256k1 elliptic curve used in Bitcoin and Ethereum
     * @param SECP_256_R1 The secp256r1 elliptic curve used in NIST standards
     */
    enum EllipticType {
        NONE,
        SECP_256_K1,
        SECP_256_R1
    }

    /**
     * @notice Structure representing a cryptographic verification method
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
     * @notice Structure representing a verification relationship with temporal validity
     * @param name The human-readable name identifying this verification relationship
     * @param vMethodId The unique identifier referencing the associated verification method
     * @param notBefore The timestamp before which this relationship is not valid
     * @param notAfter The timestamp after which this relationship expires
     * @param indexDid The numerical index of the DID within the registry
     */
    struct VRelationship {
        string name;
        bytes32 vMethodId;
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
        bytes32 did,
        string baseDocument,
        bytes32 vMethodId,
        bytes publicKey,
        EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter
    );

    /**
     * @notice Emitted when the first DID document is successfully inserted by an ISBE authorised account
     * @param did The decentralised identifier string that was registered
     * @param baseDocument The base JSON-LD document content for the DID
     * @param vMethodId The unique identifier for the initial verification method
     * @param publicKey The public key material for the initial verification method
     * @param ellipticType The elliptic curve algorithm used for the initial key
     * @param notBefore The timestamp before which the verification method is invalid
     * @param notAfter The timestamp after which the verification method expires
     * @param alsoKnownAs Alternative identifier for the entity (e.g., irn:orgs:inetum)
     */
    event FirstDidDocumentInserted(
        bytes32 did,
        string baseDocument,
        bytes32 vMethodId,
        bytes publicKey,
        EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter,
        string alsoKnownAs
    );

    /**
     * @notice Emitted when the alsoKnownAs field is updated by an ISBE authorised account
     * @param did The decentralised identifier whose alsoKnownAs was updated
     * @param alsoKnownAs The new alsoKnownAs value
     */
    event AlsoKnownAsUpdated(bytes32 did, string alsoKnownAs);

    /**
     * @notice Emitted when the base document content of a DID is updated
     * @param did The decentralised identifier whose base document was modified
     * @param baseDocument The new base JSON-LD document content
     */
    event BaseDocumentUpdated(bytes32 did, string baseDocument);

    /**
     * @notice Raised when an invalid or unsupported elliptic curve type is specified
     * @dev This error ensures only supported cryptographic algorithms are used within
     *      the DID registry to maintain security and compatibility standards
     */
    error InvalidEllipticCurve();

    /**
     * @notice Raised when the first public key does not match the configured network type
     * @dev This error ensures cryptographic consistency across the network by requiring
     *      the initial verification method to use the network's configured algorithm
     * @param ellipticType The elliptic curve type that was provided but does not match
     */
    error FirstPublicKeyMustBeTheSameThanTheNetwork(EllipticType ellipticType);

    /**
     * @notice Raised when attempting to register a DID that already exists in the registry
     * @dev This error prevents duplicate DID registration and maintains registry integrity
     * @param did The decentralised identifier string that already exists
     */
    error DidAlreadyExists(bytes32 did);

    /**
     * @notice Raised when attempting to use a DID that does not exist in the registry
     * @dev This error ensures operations target valid DIDs and prevents unauthorised access
     * @param did The decentralised identifier string that does not exist
     */
    error DidNotExists(bytes32 did);

    /**
     * @notice Raised when provided control bytes are malformed or invalid
     * @dev This error ensures proper formatting of cryptographic control parameters
     *      used in verification and authentication operations
     */
    error InvalidControlBytes();

    /**
     * @notice Raised when public key length does not match expected format requirements
     * @dev This error ensures cryptographic keys conform to expected byte lengths for
     *      the specified elliptic curve algorithm to prevent malformed key usage
     */
    error InvalidPubKeyLength();

    /**
     * @notice Raised when attempting to operate with an invalid verification method
     * @dev This error prevents operations on malformed or non-existent verification
     *      methods to maintain document integrity and security
     * @param methodName The verification method identifier that is invalid
     */
    error InvalidVerificationMethodName(string methodName);

    /**
     * @notice Raised when attempting to create a verification relationship that already exists
     * @dev This error prevents duplicate relationships between DIDs and verification methods
     *      to maintain data consistency and prevent conflicting permissions
     * @param did The decentralised identifier containing the existing relationship
     * @param name The verification relationship name that already exists
     * @param vMethodId The verification method identifier that already has this relationship
     */
    error VerificationRelationshipExists(
        bytes32 did,
        string name,
        bytes32 vMethodId
    );

    /**
     * @notice Raised when attempting to perform an operation requiring ISBE authorisation
     * @dev This error ensures that sensitive operations are only performed by
     *      accounts with the appropriate ISBE role
     */
    error UnauthorizedIsbeAccount();

    /**
     * @notice Raised when an address is not known in the DID registry or has invalid/expired capability invocation
     * @dev This covers: not registered, revoked, no capability invocation, or expired
     * @param addr The Ethereum address that is not known
     */
    error AddressNotKnown(address addr);

    /**
     * @notice Raised when caller is not an authorized controller of the target DID
     * @param caller The address attempting the operation
     * @param callerDid The DID of the caller
     * @param targetDid The target DID that requires authorization
     */
    error UnauthorizedController(
        address caller,
        bytes32 callerDid,
        bytes32 targetDid
    );

    /**
     * @notice Raised when attempting to insert a subsequent DID document without a first document
     * @dev This error ensures that the first document must be inserted via insertFirstDidDocument
     *      before additional documents can be added
     * @param did The decentralised identifier that requires a first document
     */
    error FirstDocumentNotInserted(bytes32 did);

    /**
     * @notice Initialises the DID registry with the specified elliptic curve algorithm
     * @dev Sets the network-wide cryptographic standard and prepares the registry for
     *      DID document operations. This function can only be called once per deployment
     * @param ellipticType The elliptic curve algorithm to use for the entire network
     */
    function initializeDiDRegistry(EllipticType ellipticType) external;

    /**
     * @notice Inserts the first DID document with cryptographic proof validation
     * @dev Creates the initial DID document with the DID itself as controller.
     *      Only callable by accounts with ISBE role. Validates cryptographic proof
     *      against the provided public key and DID for secure identity establishment
     * @param did The decentralised identifier string to register
     * @param baseDocument The base JSON-LD document content containing DID metadata
     * @param vMethodId The unique identifier for the initial verification method
     * @param proof The cryptographic proof to validate against public key and DID
     * @param publicKey The public key bytes for cryptographic verification
     * @param ellipticType The elliptic curve algorithm for the verification method
     * @param notBefore Unix timestamp when the verification method becomes valid
     * @param notAfter Unix timestamp when the verification method expires
     * @param alsoKnownAs Alternative identifier for the entity (e.g., irn:orgs:inetum)
     * @return success Boolean indicating whether the insertion completed successfully
     */
    function insertFirstDidDocument(
        bytes32 did,
        string memory baseDocument,
        bytes32 vMethodId,
        bytes memory proof,
        bytes memory publicKey,
        EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter,
        string memory alsoKnownAs
    ) external returns (bool success);

    /**
     * @notice Inserts a new DID document with initial verification method into the registry
     * @dev Creates a complete DID document with cryptographic verification capabilities
     *      and temporal validity constraints for secure identity management.
     *      Inherits alsoKnownAs from the first document. Can only be called by
     *      authorised controllers of the DID
     * @param did The decentralised identifier string to register
     * @param baseDocument The base JSON-LD document content containing DID metadata
     * @param vMethodId The unique identifier for the initial verification method
     * @param publicKey The public key bytes for cryptographic verification
     * @param ellipticType The elliptic curve algorithm for the verification method
     * @param notBefore Unix timestamp when the verification method becomes valid
     * @param notAfter Unix timestamp when the verification method expires
     * @return success Boolean indicating whether the insertion completed successfully
     */
    function insertDidDocument(
        bytes32 did,
        string memory baseDocument,
        bytes32 vMethodId,
        bytes memory publicKey,
        EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Updates the base document content of an existing DID
     * @dev Modifies the JSON-LD document content whilst preserving verification methods
     *      and relationships. Requires appropriate authorisation to prevent unauthorised changes
     * @param did The decentralised identifier whose base document should be updated
     * @param baseDocument The new base JSON-LD document content to set
     * @return success Boolean indicating whether the update completed successfully
     */
    function updateBaseDocument(
        bytes32 did,
        string memory baseDocument
    ) external returns (bool success);

    /**
     * @notice Updates the alsoKnownAs field of an existing DID
     * @dev Modifies the alternative identifier whilst preserving all other document data.
     *      Only callable by accounts with ISBE role for security and governance
     * @param did The decentralised identifier whose alsoKnownAs should be updated
     * @param alsoKnownAs The new alternative identifier value to set
     * @return success Boolean indicating whether the update completed successfully
     */
    function updateAlsoKnownAs(
        bytes32 did,
        string memory alsoKnownAs
    ) external returns (bool success);

    /**
     * @notice Retrieves a paginated list of registered decentralised identifiers
     * @dev Provides efficient enumeration of all DIDs in the registry with pagination
     *      support for large datasets and optimised gas usage
     * @param page The page number to retrieve (starting from 0)
     * @param pageSize The maximum number of items to return per page
     * @return items Array of DID strings for the requested page
     * @return total Total number of DIDs registered in the entire registry
     * @return howMany Actual number of DIDs returned in this response
     * @return prev Previous page number (0 if on first page)
     * @return next Next page number (0 if on last page)
     */
    function getDids(
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            bytes32[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Retrieves the complete current DID document with all verification methods
     * @dev Returns the full document structure including base content, alsoKnownAs, controllers,
     *      verification methods, and relationships as they exist at the current timestamp
     * @param did The decentralised identifier to retrieve
     * @return baseDocument The base JSON-LD document content
     * @return alsoKnownAs The alternative identifier for the entity
     * @return controllers Array of DID strings authorised to control this document
     * @return vMethodIds Array of verification method identifiers
     * @return vMethods Array of verification method structures with keys and algorithms
     * @return vRelationships Array of verification relationships with temporal validity
     */
    function getDidDocument(
        bytes32 did
    )
        external
        view
        returns (
            string memory baseDocument,
            string memory alsoKnownAs,
            bytes32[] memory controllers,
            bytes32[] memory vMethodIds,
            VMethod[] memory vMethods,
            VRelationship[] memory vRelationships
        );

    /**
     * @notice Retrieves the DID document as it existed at a specific historical timestamp
     * @dev Returns the document structure with temporal filtering applied to show only
     *      verification methods and relationships that were valid at the specified time
     * @param did The decentralised identifier to retrieve
     * @param timestamp Unix timestamp for historical document state retrieval
     * @return baseDocument The base JSON-LD document content at the specified time
     * @return alsoKnownAs The alternative identifier for the entity
     * @return controllers Array of DID strings authorised to control this document
     * @return vMethodIds Array of verification method identifiers valid at timestamp
     * @return vMethods Array of verification methods that were active at timestamp
     * @return vRelationships Array of relationships that were valid at timestamp
     */
    function getDidDocumentByTimestamp(
        bytes32 did,
        uint256 timestamp
    )
        external
        view
        returns (
            string memory baseDocument,
            string memory alsoKnownAs,
            bytes32[] memory controllers,
            bytes32[] memory vMethodIds,
            VMethod[] memory vMethods,
            VRelationship[] memory vRelationships
        );
}
