// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {IAccessControl} from './IAccessControl.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {_ACCESS_CONTROL_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../constants/roles.sol';

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
    /// @param _role The required role
    /// @dev Reverts with `AccountHasNoRole` error if the account does not have the specific role
    modifier onlyRole(bytes32 _role) {
        _checkRole(_role);
        _;
    }

    function _initializeRbacs(
        IAccessControl.Rbac[] memory _rbacs
    ) internal virtual {
        _checkRbacs(_rbacs);
        uint256 rbacsLength = _rbacs.length;
        for (uint256 index; index < rbacsLength; ++index) {
            _grantRoles(_rbacs[index].role, _rbacs[index].members);
        }
    }

    function _setRoleAdmin(bytes32 _role, bytes32 _adminRole) internal virtual {
        bytes32 previousAdminRole = _getRoleAdmin(_role);
        if (previousAdminRole == _adminRole) return;
        _accessControlStorage().roles[_role].adminRole = _adminRole;
        emit IAccessControl.RoleAdminChanged(
            _role,
            previousAdminRole,
            _adminRole,
            _msgSender()
        );
    }

    function _grantRole(bytes32 _role, address _account) internal virtual {
        if (_hasRole(_role, _account)) return;

        _accessControlStorage().roles[_role].members.add(_account);
        _accessControlStorage().rolesByAccount[_account].add(_role);

        emit IAccessControl.RoleGranted(_role, _account, _msgSender());
    }

    function _grantRoles(
        bytes32 _role,
        address[] memory _accounts
    ) internal virtual {
        uint256 accountsLength = _accounts.length;
        for (uint256 index; index < accountsLength; ++index) {
            _grantRole(_role, _accounts[index]);
        }
    }

    function _revokeRole(bytes32 _role, address _account) internal virtual {
        if (!_hasRole(_role, _account)) return;

        _accessControlStorage().roles[_role].members.remove(_account);
        _accessControlStorage().rolesByAccount[_account].remove(_role);

        emit IAccessControl.RoleRevoked(_role, _account, _msgSender());
    }

    function _hasRole(
        bytes32 _role,
        address _account
    ) internal view virtual returns (bool) {
        return _accessControlStorage().roles[_role].members.contains(_account);
    }

    function _getRoleAdmin(
        bytes32 _role
    ) internal view virtual returns (bytes32) {
        return _accessControlStorage().roles[_role].adminRole;
    }

    function _checkRole(bytes32 _role) internal view virtual {
        _checkRole(_role, _msgSender());
    }

    function _checkRole(bytes32 _role, address _account) internal view virtual {
        require(
            _hasRole(_role, _account),
            IAccessControl.AccountHasNoRole(_account, _role)
        );
    }

    function _checkRoles(bytes32[] memory _roles) internal view virtual {
        _checkRoles(_roles, _msgSender());
    }

    function _checkRoles(
        bytes32[] memory _roles,
        address _account
    ) internal view virtual {
        uint256 length = _roles.length;
        for (; length > 0; ) {
            unchecked {
                --length;
            }
            if (_hasRole(_roles[length], _account)) return;
        }
        revert IAccessControl.AccountHasNoRoles(_account, _roles);
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

    function _checkRbacs(IAccessControl.Rbac[] memory _rbacs) private pure {
        uint256 rbacLength = _rbacs.length;
        bool adminRoleFound;
        for (uint256 index; index < rbacLength; ++index) {
            for (
                uint256 innerIndex = index + 1;
                innerIndex < rbacLength;
                ++innerIndex
            ) {
                require(
                    _rbacs[index].role != _rbacs[innerIndex].role,
                    IAccessControl.RoleMustBeUnique(_rbacs[index].role)
                );
            }
            if (!adminRoleFound && _rbacs[index].role == _DEFAULT_ADMIN_ROLE) {
                adminRoleFound = true;
            }
            _checkMembers(_rbacs[index].role, _rbacs[index].members);
        }
        if (!adminRoleFound) revert IAccessControl.MissingAdminRole();
    }

    function _checkMembers(
        bytes32 _role,
        address[] memory _members
    ) private pure {
        uint256 membersLength = _members.length;
        for (uint256 index; index < membersLength; ++index) {
            address currentMember = _members[index];
            _checkAddressIsNotZero(currentMember);
            for (
                uint256 innerIndex = index + 1;
                innerIndex < membersLength;
                ++innerIndex
            ) {
                require(
                    currentMember != _members[innerIndex],
                    IAccessControl.RoleMemberMustBeUnique(_role, currentMember)
                );
            }
        }
    }
}
