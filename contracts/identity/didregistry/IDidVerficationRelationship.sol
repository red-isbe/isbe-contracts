// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title DID Verification Relationship Interface
 * @notice Interface for managing verification relationships between DIDs and verification methods
 * @dev Provides functionality to establish temporal relationships between DIDs and their
 *      verification methods with validity periods
 * @author ISBE Development Team
 */
interface IDidVerificationRelationship {
    /**
     * @notice Structure representing a DID with its validity period
     * @param did The decentralised identifier
     * @param notBefore Unix timestamp when the DID becomes valid
     * @param notAfter Unix timestamp when the DID expires
     */
    struct DidWithPeriod {
        string did;
        uint256 notBefore;
        uint256 notAfter;
    }

    /**
     * @notice Emitted when a new verification relationship is established
     * @param did The decentralised identifier involved in the relationship
     * @param name The name of the verification relationship type
     * @param vMethodId The verification method identifier being linked
     * @param notBefore Unix timestamp when the relationship becomes valid
     * @param notAfter Unix timestamp when the relationship expires
     */
    event VerificationRelationshipAdded(
        string did,
        string name,
        string vMethodId,
        uint256 notBefore,
        uint256 notAfter
    );

    /**
     * @notice Establishes a new verification relationship between a DID and verification method
     * @dev Creates a temporal link with specified validity period
     * @param did The decentralised identifier to establish the relationship for
     * @param name The type of verification relationship (e.g., "authentication")
     * @param vMethodId The verification method identifier to link with
     * @param notBefore Unix timestamp when the relationship becomes active
     * @param notAfter Unix timestamp when the relationship expires
     * @return success Boolean indicating whether the operation completed successfully
     */
    function addVerificationRelationship(
        string memory did,
        string memory name,
        string memory vMethodId,
        uint256 notBefore,
        uint256 notAfter
    ) external returns (bool success);

    /**
     * @notice Retrieves paginated list of DIDs associated with a verification relationship
     * @dev Returns DIDs that have the specified verification method and relationship type
     * @param vMethodId The verification method identifier to query for
     * @param name The verification relationship name to filter by
     * @param page The page number to retrieve (zero-based)
     * @param pageSize The maximum number of items per page
     * @return items Array of DidWithPeriod structures matching the criteria
     * @return total Total number of DIDs with this verification relationship
     * @return howMany Number of items returned in current page
     * @return prev Previous page number (zero if no previous page)
     * @return next Next page number (zero if no next page)
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
}
