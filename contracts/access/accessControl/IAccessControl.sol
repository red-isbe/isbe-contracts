// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Access Control Interface
/// @notice External interface for role-based access control functionality
interface IAccessControl {
    /**
     * @title Rbac (Role-Based Access Control) Structure
     * @dev This struct is used to implement a simple role-based access control mechanism.
     * It defines a role and the list of addresses that are members of that role.
     */
    struct Rbac {
        /**
         * @dev A unique identifier for the role.
         * This is typically a `bytes32` hash that represents the role name (e.g., keccak256("ADMIN_ROLE")).
         */
        bytes32 role;
        /**
         * @dev An array of addresses that are members of the role.
         * These accounts have been granted the privileges associated with the specified role.
         */
        address[] members;
    }

    /// @notice Emitted when a role's admin role is changed
    /// @param role The role identifier
    /// @param previousAdminRole The previous admin role
    /// @param newAdminRole The new admin role
    /// @param sender The address that performed the grant
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole,
        address sender
    );

    /// @notice Emitted when a role is granted to an account
    /// @param role The role identifier
    /// @param account The account receiving the role
    /// @param sender The address that performed the grant
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /// @notice Emitted when a role is revoked from an account
    /// @param role The role identifier
    /// @param account The account losing the role
    /// @param sender The address that performed the revocation
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    error MissingAdminRole();

    error RoleMustBeUnique(bytes32 role);
    error RoleMemberMustBeUnique(bytes32 role, address member);

    /// @notice Error indicating an account does not hold a required role
    /// @param account The account being checked
    /// @param role The role required
    error AccountHasNoRole(address account, bytes32 role);

    /// @notice Error indicating an account does not hold any of the required roles
    /// @param account The account being checked
    /// @param roles The roles required
    error AccountHasNoRoles(address account, bytes32[] roles);

    /// @notice Error indicating that a role is immutable and it's members cannot be changed
    /// @param role The immutable role identifier
    error RoleIsImmutable(bytes32 role);

    /// @notice Error indicating that there has to be at least one member for a role
    /// @param role The role identifier
    error AtLeastOneMemberForRole(bytes32 role);

    /// @notice Initializes the Access Control contrl grating roles
    /// @param _rbacs Addresses and roles to be granted
    function initializeAccessControl(Rbac[] memory _rbacs) external;

    /// @notice Grants a role to an account
    /// @param _role The role identifier
    /// @param _account The address to grant the role to
    function grantRole(bytes32 _role, address _account) external;

    /// @notice Revokes a role from an account
    /// @param _role The role identifier
    /// @param _account The address to revoke the role from
    function revokeRole(bytes32 _role, address _account) external;

    /// @notice Allows caller to renounce a role they hold
    /// @param _role The role to renounce
    function renounceRole(bytes32 _role) external;

    /// @notice Sets the admin role of a given role
    /// @param _role The role whose admin is being changed
    /// @param _adminRole The new admin role
    function setRoleAdmin(bytes32 _role, bytes32 _adminRole) external;

    /// @notice Checks if an account holds a given role
    /// @param _role The role identifier
    /// @param _account The address to check
    /// @return True if account has the role, false otherwise
    function hasRole(
        bytes32 _role,
        address _account
    ) external view returns (bool);

    /// @notice Returns the admin role controlling a given role
    /// @param _role The role to query
    /// @return The admin role associated with the role
    function getRoleAdmin(bytes32 _role) external view returns (bytes32);

    /// @notice Returns the number of members assigned to a specific role
    /// @param _role The role identifier
    /// @return The total number of accounts that have been granted the role
    function getRoleMembersCount(bytes32 _role) external view returns (uint256);

    /// @notice Returns a paginated list of addresses that hold a specific role
    /// @param _role The role identifier
    /// @param _pageIndex The index of the page to fetch (starting from 0)
    /// @param _pageLength The number of members to return per page
    /// @return members_ A list of addresses that have been granted the role
    function getRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view returns (address[] memory members_);

    /// @notice Returns the number of roles assigned to a specific account
    /// @param _account The address whose roles are being queried
    /// @return The total number of roles the account has
    function getRolesByAccountCount(
        address _account
    ) external view returns (uint256);

    /// @notice Returns a paginated list of roles assigned to a specific account
    /// @param _account The address whose roles are being queried
    /// @param _pageIndex The index of the page to fetch (starting from 0)
    /// @param _pageLength The number of roles to return per page
    /// @return roles_ A list of role identifiers that the account holds
    function getRolesByAccount(
        address _account,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view returns (bytes32[] memory roles_);
}
