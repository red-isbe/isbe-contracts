// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Access Control Interface linked to the DidRegistry
/// @notice External interface for role-based access control functionality
interface IAccessControlDid {
    /**
     * @title Rbac (Role-Based Access Control) Structure
     * @dev This struct is used to implement a simple role-based access control mechanism.
     * It defines a role and the list of DIDs that are members of that role.
     */
    struct Rbac {
        /**
         * @dev A unique identifier for the role.
         * This is typically a `bytes32` hash that represents the role name (e.g., keccak256("ADMIN_ROLE")).
         */
        bytes32 role;
        /**
         * @dev An array of DIDs that are members of the role.
         * These dids have been granted the privileges associated with the specified role.
         */
        string[] dids;
    }

    /// @notice Emitted when a role's admin role is changed
    /// @param role The role identifier
    /// @param previousAdminRole The previous admin role
    /// @param newAdminRole The new admin role
    /// @param sender The did that performed the grant
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole,
        string sender
    );

    /// @notice Emitted when a role is granted to an did
    /// @param role The role identifier
    /// @param did The did receiving the role
    /// @param sender The address that performed the grant
    event RoleGranted(bytes32 indexed role, string did, string sender);

    /// @notice Emitted when a role is revoked from an did
    /// @param role The role identifier
    /// @param did The did losing the role
    /// @param sender The did that performed the revocation
    event RoleRevoked(bytes32 indexed role, string did, string sender);

    error MissingAdminRole();

    error RoleMustBeUnique(bytes32 role);
    error RoleMemberMustBeUnique(bytes32 role, bytes32 did);

    /// @notice Error indicating an did does not hold a required role
    /// @param did The did being checked
    /// @param role The role required
    error AccountHasNoRole(string did, bytes32 role);

    /// @notice Error indicating an did does not hold any of the required roles
    /// @param did The did being checked
    /// @param roles The roles required
    error AccountHasNoRoles(string did, bytes32[] roles);

    /// @notice Error indicating that a role is immutable and it's members cannot be changed
    /// @param role The immutable role identifier
    error RoleIsImmutable(bytes32 role);

    /// @notice Error indicating that there has to be at least one member for a role
    /// @param role The role identifier
    error AtLeastOneMemberForRole(bytes32 role);

    /// @notice Initializes the Access Control contrl grating roles
    /// @param _rbacs Addresses and roles to be granted
    function initializeAccessControl(Rbac[] memory _rbacs) external;

    /// @notice Grants a role to an did
    /// @param _role The role identifier
    /// @param _did The did to grant the role to
    function grantRole(bytes32 _role, string memory _did) external;

    /// @notice Revokes a role from an did
    /// @param _role The role identifier
    /// @param _did The address to revoke the role from
    function revokeRole(bytes32 _role, string memory _did) external;

    /// @notice Allows caller to renounce a role they hold
    /// @param _role The role to renounce
    function renounceRole(bytes32 _role) external;

    /// @notice Sets the admin role of a given role
    /// @param _role The role whose admin is being changed
    /// @param _adminRole The new admin role
    function setRoleAdmin(bytes32 _role, bytes32 _adminRole) external;

    /// @notice Checks if a DID holds a given role
    /// @param _role The role identifier
    /// @param _did The DID of the sender
    /// @param _addr The address to check
    /// @return True if the DID has the role, false otherwise
    function hasRole(
        bytes32 _role,
        string memory _did,
        address _addr
    ) external view returns (bool);

    /// @notice Returns the admin role controlling a given role
    /// @param _role The role to query
    /// @return The admin role associated with the role
    function getRoleAdmin(bytes32 _role) external view returns (bytes32);

    /// @notice Returns the total number of DIDs that have been granted the role
    /// @param _role The role identifier
    /// @return The total number of DIDs that have been granted the role
    function getRoleMembersCount(bytes32 _role) external view returns (uint256);

    /// @notice Returns a paginated list of DIDs that have been granted the role
    /// @param _role The role identifier
    /// @param _pageIndex The index of the page to fetch (starting from 0)
    /// @param _pageLength The number of DIDs to return per page
    /// @return did_ A list of DIDs that have been granted the role

    function getRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view returns (string[] memory did_);

    /// @notice Returns the number of roles assigned to a specific did
    /// @param _did The did whose roles are being queried
    /// @return The total number of roles the did has
    function getRolesByDidLength(
        string memory _did
    ) external view returns (uint256);

    /// @notice Returns a paginated list of roles assigned to a specific did
    /// @param _did The did whose roles are being queried
    /// @param _pageIndex The index of the page to fetch (starting from 0)
    /// @param _pageLength The number of roles to return per page
    /// @return roles_ A list of role identifiers that the did holds
    function getRolesByDid(
        string memory _did,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view returns (bytes32[] memory roles_);
}
