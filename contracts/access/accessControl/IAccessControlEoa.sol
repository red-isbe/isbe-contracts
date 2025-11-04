// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title EOA-Based Access Control Interface
/// @notice Interface for traditional address-based role access control
/// @dev This interface provides the standard OpenZeppelin-style access control functionality
interface IAccessControlEoa {
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
         * These addresses have been granted the privileges associated with the specified role.
         */
        address[] members;
    }

    /// @notice Emitted when a role is granted to an address
    /// @param role The role identifier
    /// @param account The address receiving the role
    /// @param sender The address that performed the grant
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /// @notice Emitted when a role is revoked from an address
    /// @param role The role identifier
    /// @param account The address losing the role
    /// @param sender The address that performed the revocation
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /// @notice Emitted when a role's admin is changed
    /// @param role The role whose admin is changing
    /// @param previousAdminRole The previous admin role
    /// @param newAdminRole The new admin role
    /// @param sender The address that performed the change
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole,
        address sender
    );

    /// @dev Error thrown when an account does not have a required role
    /// @param account The account that lacks the role
    /// @param role The required role that is missing
    error AccountHasNoRole(address account, bytes32 role);

    /// @dev Error thrown when an account does not have any of the required roles
    /// @param account The account that lacks the roles
    /// @param roles The array of roles, none of which the account has
    error AccountHasNoRoles(address account, bytes32[] roles);

    /// @dev Error thrown when trying to assign duplicate roles
    /// @param role The duplicate role
    error RoleMustBeUnique(bytes32 role);

    /// @dev Error thrown when trying to renounce the last member of a critical role
    /// @param role The role that must have at least one member
    error AtLeastOneMemberForRole(bytes32 role);

    /// @dev Error thrown when trying to modify an immutable ISBE role
    /// @param role The immutable role that cannot be modified
    error RoleIsImmutable(bytes32 role);

    /// @dev Error thrown when admin role is missing from initialization
    error MissingAdminRole();

    /// @dev Error thrown when trying to assign a role member that already exists
    /// @param role The role identifier
    /// @param member The member that already has the role
    error RoleMemberMustBeUnique(bytes32 role, address member);

    /// @notice Initializes the access control system with initial roles
    /// @param rbacs Array of roles and their initial members to be granted
    function initializeAccessControl(Rbac[] memory rbacs) external;

    /// @notice Grants a role to an address
    /// @param role The role identifier
    /// @param account The address to grant the role to
    function grantRole(bytes32 role, address account) external;

    /// @notice Revokes a role from an address
    /// @param role The role identifier
    /// @param account The address to revoke the role from
    function revokeRole(bytes32 role, address account) external;

    /// @notice Renounces a role (can only be called by the role holder)
    /// @param role The role identifier
    function renounceRole(bytes32 role) external;

    /// @notice Sets the admin role for a given role
    /// @param role The role whose admin is being set
    /// @param adminRole The role that will become the admin
    function setRoleAdmin(bytes32 role, bytes32 adminRole) external;

    /// @notice Checks if an account has a specific role
    /// @param role The role identifier to check
    /// @param account The address to check for role membership
    /// @return True if the account has the role
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    /// @notice Returns the admin role that controls the given role
    /// @param role The role to query
    /// @return The admin role identifier
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /// @notice Returns the number of accounts that have a specific role
    /// @param role The role identifier
    /// @return The total number of accounts with the role
    function getRoleMembersCount(bytes32 role) external view returns (uint256);

    /// @notice Returns a paginated list of addresses that have a specific role
    /// @param role The role identifier
    /// @param pageIndex The page index (starting from 0)
    /// @param pageLength The number of addresses to return per page
    /// @return members_ Array of addresses that have the role
    function getRoleMembers(
        bytes32 role,
        uint256 pageIndex,
        uint256 pageLength
    ) external view returns (address[] memory members_);

    /// @notice Returns the number of roles assigned to a specific address
    /// @param account The address whose roles are being queried
    /// @return The total number of roles the address has
    function getRolesByAccountCount(
        address account
    ) external view returns (uint256);

    /// @notice Returns a paginated list of roles assigned to a specific address
    /// @param account The address whose roles are being queried
    /// @param pageIndex The page index (starting from 0)
    /// @param pageLength The number of roles to return per page
    /// @return roles_ Array of role identifiers that the address holds
    function getRolesByAccount(
        address account,
        uint256 pageIndex,
        uint256 pageLength
    ) external view returns (bytes32[] memory roles_);
}
