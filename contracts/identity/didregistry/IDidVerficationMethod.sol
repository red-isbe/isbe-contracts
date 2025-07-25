// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title DID Verification Method Interface
 * @notice Interface for managing cryptographic verification methods within DID documents
 * @dev Provides functionality to add, revoke, expire, and roll verification methods
 *      with support for different cryptographic key types
 * @author ISBE Development Team
 */
interface IDidVerificationMethod {
    /**
     * @notice Arguments structure for rolling verification methods
     * @param did The decentralised identifier being updated
     * @param vMethodId The new verification method identifier
     * @param publicKey The new public key in bytes format
     * @param isSecp256k1 Boolean indicating if the key uses secp256k1 curve
     * @param notBefore Unix timestamp when the new method becomes valid
     * @param notAfter Unix timestamp when the new method expires
     * @param oldVMethodId The verification method identifier being replaced
     * @param duration The validity duration for the new verification method
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
     * @notice Emitted when a new verification method is added to a DID
     * @param did The decentralised identifier receiving the new verification method
     * @param vMethodId The unique identifier for the verification method
     * @param publicKey The public key associated with the verification method
     * @param isSecp256k1 Boolean indicating if the key uses secp256k1 elliptic curve
     */
    event VerificationMethodAdded(
        string did,
        string vMethodId,
        bytes publicKey,
        bool isSecp256k1
    );

    /**
     * @notice Emitted when a verification method is revoked from a DID
     * @param did The decentralised identifier losing the verification method
     * @param vMethodId The identifier of the verification method being revoked
     * @param notAfter Unix timestamp when the revocation becomes effective
     */
    event VerificationMethodRevoked(
        string did,
        string vMethodId,
        uint256 notAfter
    );

    /**
     * @notice Emitted when a verification method expires
     * @param did The decentralised identifier with the expiring verification method
     * @param vMethodId The identifier of the verification method expiring
     * @param notAfter Unix timestamp when the method expires
     */
    event VerificationMethodExpired(
        string did,
        string vMethodId,
        uint256 notAfter
    );

    /**
     * @notice Emitted when a verification method is rolled over to a new one
     * @param did The decentralised identifier undergoing method rollover
     * @param vMethodId The new verification method identifier
     * @param publicKey The new public key for the verification method
     * @param isSecp256k1 Boolean indicating if the new key uses secp256k1 curve
     * @param notBefore Unix timestamp when the new method becomes valid
     * @param notAfter Unix timestamp when the new method expires
     * @param oldVMethodId The identifier of the verification method being replaced
     * @param duration The validity period for the new verification method
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
     * @notice Adds a new verification method to the specified DID
     * @dev Creates a new cryptographic verification method with the provided key material
     * @param did The decentralised identifier to receive the verification method
     * @param vMethodId The unique identifier for the new verification method
     * @param publicKey The public key bytes for cryptographic verification
     * @param isSecp256k1 Boolean flag indicating secp256k1 elliptic curve usage
     * @return success Boolean indicating whether the operation completed successfully
     */
    function addVerificationMethod(
        string memory did,
        string memory vMethodId,
        bytes memory publicKey,
        bool isSecp256k1
    ) external returns (bool success);

    /**
     * @notice Revokes an existing verification method from the specified DID
     * @dev Permanently disables the verification method from the specified timestamp
     * @param did The decentralised identifier losing the verification method
     * @param vMethodId The identifier of the verification method to revoke
     * @param notAfter Unix timestamp when the revocation becomes effective
     * @return success Boolean indicating whether the operation completed successfully
     */
    function revokeVerificationMethod(
        string memory did,
        string memory vMethodId,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Expires a verification method at the specified timestamp
     * @dev Sets the expiration time for the verification method
     * @param did The decentralised identifier with the expiring verification method
     * @param vMethodId The identifier of the verification method to expire
     * @param notAfter Unix timestamp when the method should expire
     * @return success Boolean indicating whether the operation completed successfully
     */
    function expireVerificationMethod(
        string memory did,
        string memory vMethodId,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Rolls over a verification method to a new cryptographic key
     * @dev Replaces an existing verification method with a new one in a single operation
     * @param args The RollArgs structure containing all necessary rollover parameters
     * @return success Boolean indicating whether the operation completed successfully
     */
    function rollVerificationMethod(
        RollArgs memory args
    ) external returns (bool success);
}
