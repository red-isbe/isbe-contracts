// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _ACCESS_CONTROL_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {IAccessControl} from './IAccessControl.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

/// @title AccessControlInternal
/// @notice Internal logic for role-based access control
abstract contract AccessControlInternal is ISBEContext {
    /// @notice Struct storing all roles and their data
    struct AccessControlStorage {
        mapping(bytes32 => RoleData) roles;
    }

    /// @notice Struct storing members and admin role for a specific role
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    /// @notice Constant value representing the default admin role
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /// @notice Modifier to restrict function to accounts with a specific role
    /// @param role The required role
    /// @dev Reverts with `AccountHasNoRole` error if the account does not have the specific role
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    function _initializeRbacs(
        IAccessControl.Rbac[] memory rbacs
    ) internal virtual {
        _checkRbacs(rbacs);
        uint256 rbacsLength = rbacs.length;
        for (uint256 index; index < rbacsLength; ++index) {
            _grantRoles(rbacs[index].role, rbacs[index].members);
        }
    }

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = _getRoleAdmin(role);
        if (previousAdminRole == adminRole) return;
        _accessControlStorage().roles[role].adminRole = adminRole;
        emit IAccessControl.RoleAdminChanged(
            role,
            previousAdminRole,
            adminRole,
            _msgSender()
        );
    }

    function _grantRole(bytes32 role, address account) internal virtual {
        if (_hasRole(role, account)) return;

        _accessControlStorage().roles[role].members[account] = true;
        emit IAccessControl.RoleGranted(role, account, _msgSender());
    }

    function _grantRoles(
        bytes32 role,
        address[] memory accounts
    ) internal virtual {
        uint256 accountsLength = accounts.length;
        for (uint256 index; index < accountsLength; ++index) {
            _grantRole(role, accounts[index]);
        }
    }

    function _revokeRole(bytes32 role, address account) internal virtual {
        if (!_hasRole(role, account)) return;

        _accessControlStorage().roles[role].members[account] = false;
        emit IAccessControl.RoleRevoked(role, account, _msgSender());
    }

    function _hasRole(
        bytes32 role,
        address account
    ) internal view virtual returns (bool) {
        return _accessControlStorage().roles[role].members[account];
    }

    function _getRoleAdmin(
        bytes32 role
    ) internal view virtual returns (bytes32) {
        return _accessControlStorage().roles[role].adminRole;
    }

    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    function _checkRole(bytes32 role, address account) internal view virtual {
        require(
            _hasRole(role, account),
            IAccessControl.AccountHasNoRole(account, role)
        );
    }

    function _checkRoles(bytes32[] memory roles) internal view virtual {
        _checkRoles(roles, _msgSender());
    }

    function _checkRoles(
        bytes32[] memory roles,
        address account
    ) internal view virtual {
        bool rolesOK = false;

        for (uint256 index = 0; index < roles.length; ++index) {
            if (_hasRole(roles[index], account)) {
                rolesOK = true;
                break;
            }
        }

        require(rolesOK, IAccessControl.AccountHasNoRoles(account, roles));
    }

    /// @notice Returns the storage slot for access control
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The access control storage struct
    function _accessControlStorage()
        internal
        pure
        returns (AccessControlStorage storage storage_)
    {
        bytes32 position = _ACCESS_CONTROL_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

    function _checkRbacs(IAccessControl.Rbac[] memory rbacs) private pure {
        uint256 rbacLength = rbacs.length;
        for (uint256 index; index < rbacLength; ++index) {
            for (
                uint256 innerIndex = index + 1;
                innerIndex < rbacLength;
                ++innerIndex
            ) {
                require(
                    rbacs[index].role != rbacs[innerIndex].role,
                    IAccessControl.RoleMustBeUnique(rbacs[index].role)
                );
            }
            _checkMembers(rbacs[index].role, rbacs[index].members);
        }
    }

    function _checkMembers(
        bytes32 role,
        address[] memory members
    ) private pure {
        uint256 membersLength = members.length;
        for (uint256 index; index < membersLength; ++index) {
            address currentMember = members[index];
            _addressIsNotZero(currentMember);
            for (
                uint256 innerIndex = index + 1;
                innerIndex < membersLength;
                ++innerIndex
            ) {
                require(
                    currentMember != members[innerIndex],
                    IAccessControl.RoleMemberMustBeUnique(role, currentMember)
                );
            }
        }
    }
}
