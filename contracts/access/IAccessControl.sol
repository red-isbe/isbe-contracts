// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title Access Control Interface
/// @notice External interface for role-based access control functionality
interface IAccessControl {
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

    /// @notice Error indicating an account does not hold a required role
    /// @param account The account being checked
    /// @param role The role required
    error AccountHasNoRole(address account, bytes32 role);

    /// @notice Grants a role to an account
    /// @param role The role identifier
    /// @param account The address to grant the role to
    function grantRole(bytes32 role, address account) external;

    /// @notice Revokes a role from an account
    /// @param role The role identifier
    /// @param account The address to revoke the role from
    function revokeRole(bytes32 role, address account) external;

    /// @notice Allows caller to renounce a role they hold
    /// @param role The role to renounce
    function renounceRole(bytes32 role) external;

    /// @notice Sets the admin role of a given role
    /// @param role The role whose admin is being changed
    /// @param adminRole The new admin role
    function setRoleAdmin(bytes32 role, bytes32 adminRole) external;

    /// @notice Checks if an account holds a given role
    /// @param role The role identifier
    /// @param account The address to check
    /// @return True if account has the role, false otherwise
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    /// @notice Returns the admin role controlling a given role
    /// @param role The role to query
    /// @return The admin role associated with the role
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
}
