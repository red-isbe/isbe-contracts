// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidDocumentDetailed} from './IDidDocumentDetailed.sol';

/**
 * @title DID Verification Method Interface
 * @notice Interface for managing cryptographic verification methods within decentralised
 *         identity documents
 * @dev Provides functionality to add, revoke, expire, and roll verification methods with
 *      support for different cryptographic key types and temporal validity periods.
 *      Implements W3C DID specification verification method management with enhanced
 *      security controls and lifecycle operations
 * @author ISBE Development Team
 */
interface IDidVerificationMethod {
    /**
     * @notice Arguments structure for rolling verification methods from old to new keys
     * @param did The decentralised identifier being updated
     * @param vMethodId The new verification method identifier to be created
     * @param publicKey The new public key in bytes format for cryptographic verification
     * @param ellipticType Cryptographic algorithm specification for signature verification
     * @param notBefore Unix timestamp when the new verification method becomes valid
     * @param notAfter Unix timestamp when the new verification method expires
     * @param oldVMethodId The existing verification method identifier being replaced
     * @param duration The validity duration in seconds for the new verification method
     */
    struct RollArgs {
        bytes32 did;
        bytes32 vMethodId;
        bytes publicKey;
        IDidDocumentDetailed.EllipticType ellipticType;
        uint256 notBefore;
        uint256 notAfter;
        bytes32 oldVMethodId;
        uint256 duration;
    }

    /**
     * @notice Emitted when a new verification method is successfully added to a DID document
     * @param did The decentralised identifier receiving the new verification method
     * @param vMethodId The unique identifier assigned to the verification method
     * @param publicKey The public key bytes associated with the verification method
     * @param ellipticType Cryptographic algorithm specification for signature verification
     */
    event VerificationMethodAdded(
        bytes32 did,
        bytes32 vMethodId,
        bytes publicKey,
        IDidDocumentDetailed.EllipticType ellipticType
    );

    /**
     * @notice Emitted when a verification method is revoked and permanently disabled
     * @param did The decentralised identifier losing the verification method
     * @param vMethodId The identifier of the verification method being revoked
     * @param notAfter Unix timestamp when the revocation becomes effective
     */
    event VerificationMethodRevoked(
        bytes32 did,
        bytes32 vMethodId,
        uint256 notAfter
    );

    /**
     * @notice Emitted when a verification method reaches its expiration timestamp
     * @param did The decentralised identifier with the expiring verification method
     * @param vMethodId The identifier of the verification method expiring
     * @param notAfter Unix timestamp when the method expires and becomes invalid
     */
    event VerificationMethodExpired(
        bytes32 did,
        bytes32 vMethodId,
        uint256 notAfter
    );

    /**
     * @notice Emitted when a verification method is rolled over to a new cryptographic key
     * @param did The decentralised identifier undergoing verification method rollover
     * @param vMethodId The new verification method identifier being created
     * @param publicKey The new public key bytes for cryptographic verification
     * @param ellipticType Cryptographic algorithm specification for signature verification
     * @param notBefore Unix timestamp when the new verification method becomes valid
     * @param notAfter Unix timestamp when the new verification method expires
     * @param oldVMethodId The identifier of the verification method being replaced
     * @param duration The validity period in seconds for the new verification method
     */
    event VerificationMethodRolled(
        bytes32 did,
        bytes32 vMethodId,
        bytes publicKey,
        IDidDocumentDetailed.EllipticType ellipticType,
        uint256 notBefore,
        uint256 notAfter,
        bytes32 oldVMethodId,
        uint256 duration
    );

    /**
     * @notice Raised when attempting to add a verification method that already exists
     * @dev This error prevents duplicate verification methods within the same DID document
     *      to maintain document integrity and prevent conflicting method identifiers
     * @param did The decentralised identifier containing the existing verification method
     * @param vMethodId The verification method identifier that already exists
     */
    error VerificationMethodExists(bytes32 did, bytes32 vMethodId);

    /**
     * @notice Raised when attempting to operate on a non-existent verification method
     * @dev This error ensures operations target valid verification methods within DID
     *      documents and prevents unauthorised access attempts
     * @param did The decentralised identifier that should contain the verification method
     * @param vMethodId The verification method identifier that does not exist
     */
    error VerificationMethodNotExists(bytes32 did, bytes32 vMethodId);

    /**
     * @notice Raised when attempting to register a public key that is already in use
     * @dev This error prevents cryptographic key reuse across verification methods to
     *      maintain security and prevent key compromise scenarios across the network
     * @param publicKey The public key bytes that are already assigned to another method
     */
    error PublicKeyAlreadyInUse(bytes publicKey);

    /**
     * @notice Raised when the notAfter timestamp is invalid for the requested operation
     * @dev This error ensures temporal validity constraints are met for verification
     *      method lifecycle operations such as expiration, revocation, or rollover
     */
    error InvalidNotAfter();

    /**
     * @notice Adds a new verification method to the specified decentralised identifier
     * @dev Creates a new cryptographic verification method with the provided key material
     *      and associates it with the DID document for authentication purposes
     * @param did The decentralised identifier to receive the verification method
     * @param vMethodId The unique identifier for the new verification method
     * @param publicKey The public key bytes for cryptographic verification operations
     * @param ellipticType Cryptographic algorithm specification for signature verification
     * @return success Boolean indicating whether the operation completed successfully
     */
    function addVerificationMethod(
        bytes32 did,
        bytes32 vMethodId,
        bytes memory publicKey,
        IDidDocumentDetailed.EllipticType ellipticType
    ) external returns (bool success);

    /**
     * @notice Revokes an existing verification method from the specified DID document
     * @dev Permanently disables the verification method from the specified timestamp,
     *      preventing any future use for authentication or authorisation purposes
     * @param did The decentralised identifier losing the verification method
     * @param vMethodId The identifier of the verification method to revoke
     * @param notAfter Unix timestamp when the revocation becomes effective
     * @return success Boolean indicating whether the operation completed successfully
     */
    function revokeVerificationMethod(
        bytes32 did,
        bytes32 vMethodId,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Sets an expiration timestamp for a verification method
     * @dev Configures the verification method to become invalid at the specified
     *      timestamp, allowing for planned key rotation and temporal access control
     * @param did The decentralised identifier with the expiring verification method
     * @param vMethodId The identifier of the verification method to expire
     * @param notAfter Unix timestamp when the method should expire and become invalid
     * @return success Boolean indicating whether the operation completed successfully
     */
    function expireVerificationMethod(
        bytes32 did,
        bytes32 vMethodId,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Rolls over a verification method to a new cryptographic key pair
     * @dev Replaces an existing verification method with a new one in a single atomic
     *      operation, ensuring continuity of authentication capabilities during key rotation
     * @param args The RollArgs structure containing all necessary rollover parameters
     * @return success Boolean indicating whether the operation completed successfully
     */
    function rollVerificationMethod(
        RollArgs memory args
    ) external returns (bool success);
}
