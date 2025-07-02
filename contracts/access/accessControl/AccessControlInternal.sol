// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _ACCESS_CONTROL_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {IAccessControl} from './IAccessControl.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../constants/roles.sol';
import {
    EnumerableSet
} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {LibCommon} from '../../core/LibCommon.sol';

/// @title AccessControlInternal
/// @notice Internal logic for role-based access control
abstract contract AccessControlInternal is ISBEContext {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using LibCommon for EnumerableSet.Bytes32Set;
    using LibCommon for EnumerableSet.AddressSet;

    /// @notice Struct storing all roles and their data
    struct AccessControlStorage {
        mapping(bytes32 => RoleData) roles;
        mapping(address => EnumerableSet.Bytes32Set) rolesByAccount;
    }

    /// @notice Struct storing members and admin role for a specific role
    struct RoleData {
        EnumerableSet.AddressSet members;
        bytes32 adminRole;
    }

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

        _accessControlStorage().roles[role].members.add(account);
        _accessControlStorage().rolesByAccount[account].add(role);

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

        _accessControlStorage().roles[role].members.remove(account);
        _accessControlStorage().rolesByAccount[account].remove(role);

        emit IAccessControl.RoleRevoked(role, account, _msgSender());
    }

    function _hasRole(
        bytes32 role,
        address account
    ) internal view virtual returns (bool) {
        return _accessControlStorage().roles[role].members.contains(account);
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

    function _getRoleMembersCount(
        bytes32 _role
    ) internal view virtual returns (uint256) {
        return _accessControlStorage().roles[_role].members.length();
    }

    function _getRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view virtual returns (address[] memory members_) {
        return
            _accessControlStorage().roles[_role].members.getFromSet(
                _pageIndex,
                _pageLength
            );
    }

    function _getRolesByAccountCount(
        address _account
    ) internal view virtual returns (uint256) {
        return _accessControlStorage().rolesByAccount[_account].length();
    }

    function _getRolesByAccount(
        address _account,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view virtual returns (bytes32[] memory roles_) {
        return
            _accessControlStorage().rolesByAccount[_account].getFromSet(
                _pageIndex,
                _pageLength
            );
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
        bool adminRoleFound;
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
            if (!adminRoleFound && rbacs[index].role == _DEFAULT_ADMIN_ROLE) {
                adminRoleFound = true;
            }
            _checkMembers(rbacs[index].role, rbacs[index].members);
        }
        if (!adminRoleFound) revert IAccessControl.MissingAdminRole();
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
