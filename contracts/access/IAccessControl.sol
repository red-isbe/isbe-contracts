// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAccessControl {
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );

    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    error CallerNotRoleHolder(address caller);

    error AccountHasNoRole(address account, bytes32 role);

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);

    function getRoleAdmin(bytes32 role) external view returns (bytes32);
}
