// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IDidDocumentDetailed
 * @notice Comprehensive DID document management with verification methods
 * @dev Handles complete lifecycle of decentralised identity documents
 * @author ISBE
 */
interface IDidDocumentDetailed {
    /**
     * @notice Parameters for rolling verification methods
     * @param did Target DID identifier
     * @param vMethodId New verification method ID
     * @param publicKey New public key bytes
     * @param isSecp256k1 Whether using secp256k1 curve
     * @param notBefore Validity start timestamp
     * @param notAfter Validity end timestamp
     * @param oldVMethodId Previous method ID to replace
     * @param duration Roll operation duration
     */
    struct RollArgs {
        string did;
        string vMethodId;
        bytes publicKey;
        bool isSecp256k1;
        uint256 notBefore;
        uint256 notAfter;
        string oldVMethodId;
        uint256 duration;
    }

    /**
     * @notice Verification method structure
     * @param publicKey Public key bytes for verification
     * @param isSecp256k1 Whether key uses secp256k1 elliptic curve
     * @param revoked Whether method has been revoked
     */
    struct VMethod {
        bytes publicKey;
        bool isSecp256k1;
        bool revoked;
    }

    /**
     * @notice Verification relationship structure
     * @param name Relationship name/type
     * @param vMethodId Associated verification method ID
     * @param notBefore Validity period start timestamp
     * @param notAfter Validity period end timestamp
     * @param indexDid Index in DID's relationship array
     */
    struct VRelationship {
        string name;
        string vMethodId;
        uint256 notBefore;
        uint256 notAfter;
        uint256 indexDid;
    }

    /**
     * @notice DID with temporal validity period
     * @param did DID identifier string
     * @param notBefore Valid from timestamp
     * @param notAfter Valid until timestamp
     */
    struct DidWithPeriod {
        string did;
        uint256 notBefore;
        uint256 notAfter;
    }

    /**
     * @notice Emitted when new DID document is inserted
     * @param did DID identifier
     * @param baseDocument Base document content
     * @param vMethodId Verification method ID
     * @param publicKey Public key bytes
     * @param isSecp256k1 Whether using secp256k1
     * @param notBefore Validity start
     * @param notAfter Validity end
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
     * @notice Emitted when base document is updated
     * @param did Target DID identifier
     * @param baseDocument New document content
     */
    event BaseDocumentUpdated(string did, string baseDocument);

    /**
     * @notice Emitted when controller is added to DID
     * @param did Target DID identifier
     * @param controller Added controller DID
     */
    event ControllerAdded(string did, string controller);

    /**
     * @notice Emitted when controller is revoked from DID
     * @param did Target DID identifier
     * @param controller Revoked controller DID
     */
    event ControllerRevoked(string did, string controller);

    /**
     * @notice Emitted when verification method is added
     * @param did Target DID identifier
     * @param vMethodId Method identifier
     * @param publicKey Public key bytes
     * @param isSecp256k1 Whether using secp256k1
     */
    event VerificationMethodAdded(
        string did,
        string vMethodId,
        bytes publicKey,
        bool isSecp256k1
    );

    /**
     * @notice Emitted when verification relationship is added
     * @param did Target DID identifier
     * @param name Relationship name
     * @param vMethodId Associated method ID
     * @param notBefore Validity start
     * @param notAfter Validity end
     */
    event VerificationRelationshipAdded(
        string did,
        string name,
        string vMethodId,
        uint256 notBefore,
        uint256 notAfter
    );

    /**
     * @notice Emitted when verification method is revoked
     * @param did Target DID identifier
     * @param vMethodId Revoked method ID
     * @param notAfter Revocation timestamp
     */
    event VerificationMethodRevoked(
        string did,
        string vMethodId,
        uint256 notAfter
    );

    /**
     * @notice Emitted when verification method expires
     * @param did Target DID identifier
     * @param vMethodId Expired method ID
     * @param notAfter Expiration timestamp
     */
    event VerificationMethodExpired(
        string did,
        string vMethodId,
        uint256 notAfter
    );

    /**
     * @notice Emitted when verification method is rolled
     * @param did Target DID identifier
     * @param vMethodId New method ID
     * @param publicKey New public key
     * @param isSecp256k1 Whether using secp256k1
     * @param notBefore New validity start
     * @param notAfter New validity end
     * @param oldVMethodId Replaced method ID
     * @param duration Roll operation duration
     */
    event VerificationMethodRolled(
        string did,
        string vMethodId,
        bytes publicKey,
        bool isSecp256k1,
        uint256 notBefore,
        uint256 notAfter,
        string oldVMethodId,
        uint256 duration
    );

    /**
     * @notice Inserts new DID document with verification method
     * @param did DID identifier to create
     * @param baseDocument Base document content
     * @param vMethodId Initial verification method ID
     * @param publicKey Public key for verification
     * @param isSecp256k1 Whether key uses secp256k1
     * @param notBefore Validity start timestamp
     * @param notAfter Validity end timestamp
     * @return success Whether operation succeeded
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
     * @notice Updates base document for existing DID
     * @param did Target DID identifier
     * @param baseDocument New document content
     * @return success Whether update succeeded
     */
    function updateBaseDocument(
        string memory did,
        string memory baseDocument
    ) external returns (bool success);

    /**
     * @notice Adds controller to existing DID
     * @param did Target DID identifier
     * @param controller Controller DID to add
     * @return success Whether addition succeeded
     */
    function addController(
        string memory did,
        string memory controller
    ) external returns (bool success);

    /**
     * @notice Revokes controller from DID
     * @param did Target DID identifier
     * @param controller Controller DID to revoke
     * @return success Whether revocation succeeded
     */
    function revokeController(
        string memory did,
        string memory controller
    ) external returns (bool success);

    /**
     * @notice Adds verification method to DID
     * @param did Target DID identifier
     * @param vMethodId Method identifier
     * @param publicKey Public key bytes
     * @param isSecp256k1 Whether using secp256k1
     * @return success Whether addition succeeded
     */
    function addVerificationMethod(
        string memory did,
        string memory vMethodId,
        bytes memory publicKey,
        bool isSecp256k1
    ) external returns (bool success);

    /**
     * @notice Adds verification relationship to DID
     * @param did Target DID identifier
     * @param name Relationship name
     * @param vMethodId Associated method ID
     * @param notBefore Validity start timestamp
     * @param notAfter Validity end timestamp
     * @return success Whether addition succeeded
     */
    function addVerificationRelationship(
        string memory did,
        string memory name,
        string memory vMethodId,
        uint256 notBefore,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Revokes verification method from DID
     * @param did Target DID identifier
     * @param vMethodId Method ID to revoke
     * @param notAfter Revocation timestamp
     * @return success Whether revocation succeeded
     */
    function revokeVerificationMethod(
        string memory did,
        string memory vMethodId,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Expires verification method
     * @param did Target DID identifier
     * @param vMethodId Method ID to expire
     * @param notAfter Expiration timestamp
     * @return success Whether expiration succeeded
     */
    function expireVerificationMethod(
        string memory did,
        string memory vMethodId,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Rolls verification method to new key
     * @param args Roll operation parameters
     * @return success Whether roll succeeded
     */
    function rollVerificationMethod(
        RollArgs memory args
    ) external returns (bool success);

    /**
     * @notice Gets paginated list of all DIDs
     * @param page Page number (0-indexed)
     * @param pageSize Items per page
     * @return items Array of DID strings
     * @return total Total DID count
     * @return howMany Items in current page
     * @return prev Previous page number
     * @return next Next page number
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
     * @notice Gets DIDs controlled by specific controller
     * @param controller Controller DID to query
     * @param page Page number (0-indexed)
     * @param pageSize Items per page
     * @return items Array of controlled DID strings
     * @return total Total controlled DIDs
     * @return howMany Items in current page
     * @return prev Previous page number
     * @return next Next page number
     */
    function getDidsByController(
        string memory controller,
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
     * @notice Gets DIDs by verification relationship
     * @param vMethodId Method ID to query
     * @param name Relationship name
     * @param page Page number (0-indexed)
     * @param pageSize Items per page
     * @return items Array of DIDs with periods
     * @return total Total matching DIDs
     * @return howMany Items in current page
     * @return prev Previous page number
     * @return next Next page number
     */
    function getDidsByVerificationRelationship(
        string memory vMethodId,
        string memory name,
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            DidWithPeriod[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Retrieves complete DID document
     * @param did DID identifier to query
     * @return baseDocument Base document content
     * @return controllers Array of controller DIDs
     * @return vMethodIds Array of method IDs
     * @return vMethods Array of verification methods
     * @return vRelationships Array of relationships
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
     * @notice Gets DID document at specific timestamp
     * @param did DID identifier to query
     * @param timestamp Point-in-time to query
     * @return baseDocument Historical base document
     * @return controllers Historical controllers
     * @return vMethodIds Historical method IDs
     * @return vMethods Historical methods
     * @return vRelationships Historical relationships
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

    /**
     * @notice Verifies if address controls DID
     * @param did DID identifier to check
     * @param controller Address to validate
     * @return isController Whether address controls DID
     */
    function checkController(
        string memory did,
        address controller
    ) external view returns (bool isController);
}
