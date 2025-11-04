// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title DID-Aware Access Control Interface
/// @notice Interface for role-based access control with DID support, designed to work alongside IAccessControl
/// @dev This interface provides DID-specific role management while preserving full compatibility with
///      existing AccessControl patterns
interface IAccessControlDid {
    /**
     * @title Rbac (Role-Based Access Control) Structure
     * @dev This struct is used to implement a simple role-based access control mechanism.
     * It defines a role and the list of DIDs that are members of that role.
     */
    struct RbacDid {
        /**
         * @dev A unique identifier for the role.
         * This is typically a `bytes32` hash that represents the role name (e.g., keccak256("ADMIN_ROLE")).
         */
        bytes32 role;
        /**
         * @dev An array of DID hashes that are members of the role.
         * These DIDs have been granted the privileges associated with the specified role.
         */
        bytes32[] dids;
    }

    /// @notice Emitted when a role is granted to a DID
    /// @param role The role identifier
    /// @param did The DID hash receiving the role
    /// @param sender The address that performed the grant
    event RoleGrantedToDid(
        bytes32 indexed role,
        bytes32 indexed did,
        address indexed sender
    );

    /// @notice Emitted when a role is revoked from a DID
    /// @param role The role identifier
    /// @param did The DID hash losing the role
    /// @param sender The address that performed the revocation
    event RoleRevokedFromDid(
        bytes32 indexed role,
        bytes32 indexed did,
        address indexed sender
    );

    /// @notice Emitted when the DID Access Control system is initialized
    /// @param initialRolesCount The number of initial roles granted during initialization
    /// @param initializer The address that performed the initialization
    event DidAccessControlInitialized(
        uint256 initialRolesCount,
        address indexed initializer
    );

    /// @notice Initializes the DID Access Control system, granting initial DID roles
    /// @dev Does not store DidRegistry address - queries are made to address(this) or configured address
    /// @param _rbacs Initial roles and DID hashes to be granted
    function initializeDidAccessControl(RbacDid[] memory _rbacs) external;

    /// @notice Grants a role to a DID
    /// @param _role The role identifier
    /// @param _did The DID hash to grant the role to
    function grantDidRole(bytes32 _role, bytes32 _did) external;

    /// @notice Revokes a role from a DID
    /// @param _role The role identifier
    /// @param _did The DID hash to revoke the role from
    function revokeDidRole(bytes32 _role, bytes32 _did) external;

    /// @notice Returns the total number of DIDs that have been granted the role
    /// @param _role The role identifier
    /// @return The total number of DIDs that have been granted the role
    function getRoleMembersCountForDids(
        bytes32 _role
    ) external view returns (uint256);

    /// @notice Returns a paginated list of DIDs that have been granted the role
    /// @param _role The role identifier
    /// @param _pageIndex The index of the page to fetch (starting from 0)
    /// @param _pageLength The number of DIDs to return per page
    /// @return dids_ A list of DIDs that have been granted the role
    function getDidRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view returns (bytes32[] memory dids_);

    /// @notice Returns the number of roles assigned to a specific DID
    /// @param _did The DID whose roles are being queried
    /// @return The total number of roles the DID has
    function getRolesByDidLength(bytes32 _did) external view returns (uint256);

    /// @notice Returns a paginated list of roles assigned to a specific DID
    /// @param _did The DID whose roles are being queried
    /// @param _pageIndex The index of the page to fetch (starting from 0)
    /// @param _pageLength The number of roles to return per page
    /// @return roles_ A list of role identifiers that the DID holds
    function getRolesByDid(
        bytes32 _did,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view returns (bytes32[] memory roles_);

    /// @notice Checks if a specific DID hash has the specified role
    /// @param _role The role identifier to check
    /// @param _did The DID hash to check for role membership
    /// @return True if the DID hash has been granted the role
    function hasRoleForDid(
        bytes32 _role,
        bytes32 _did
    ) external view returns (bool);
}
