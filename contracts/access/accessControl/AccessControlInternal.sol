// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {IAccessControlDid} from './IAccessControlDid.sol';
import {IAccessControlEoa} from './IAccessControlEoa.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {IsbeFactoryInternal} from '../../proxies/isbeproxy/IsbeFactoryInternal.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {_ACCESS_CONTROL_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {_DEFAULT_ADMIN_ROLE, _ISBE_ROLE} from '../../constants/roles.sol';

/// @title AccessControlInternal
/// @notice Internal logic for role-based access control
abstract contract AccessControlInternal is ISBEContext, IsbeFactoryInternal {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using LibCommon for EnumerableSet.Bytes32Set;
    using LibCommon for EnumerableSet.AddressSet;

    /// @notice Struct storing all roles and their data
    struct AccessControlStorage {
        mapping(bytes32 => RoleData) roles;
        mapping(address => EnumerableSet.Bytes32Set) rolesByAccount;
        mapping(bytes32 => EnumerableSet.Bytes32Set) didRolesByAccount;
    }

    /// @notice Struct storing members and admin role for a specific role
    struct RoleData {
        EnumerableSet.AddressSet members;
        EnumerableSet.Bytes32Set didMembers;
        bytes32 adminRole;
    }

    /// @notice Modifier to restrict function to accounts with a specific role
    /// @param _role The required role
    /// @dev Reverts with `AccountHasNoRole` error if the account does not have the specific role
    modifier onlyRole(bytes32 _role) {
        _checkRole(_role);
        _;
    }

    /// @notice Modifier to protect ISBE role from being modified
    /// @param _role The role to check
    /// @dev Reverts with `RoleIsImmutable` error if the role is the ISBE role
    modifier protectISBERole(bytes32 _role) {
        _checkProtectISBERole(_role);
        _;
    }

    function _initializeRbacs(
        IAccessControlEoa.Rbac[] memory _rbacs
    ) internal virtual {
        _checkRbacs(_rbacs);
        uint256 rbacsLength = _rbacs.length;
        for (uint256 index; index < rbacsLength; ++index) {
            _grantRoles(_rbacs[index].role, _rbacs[index].members);
        }
    }

    /// @notice Initializes DID-based roles
    /// @dev Does not store DidRegistry address - DID resolution happens via address(this)
    /// @param _rbacs Array of DID roles to initialize
    function _initializeDidAccessControl(
        IAccessControlDid.RbacDid[] memory _rbacs
    ) internal virtual {
        uint256 rbacsLength = _rbacs.length;
        for (uint256 index; index < rbacsLength; ++index) {
            bytes32 role = _rbacs[index].role;
            bytes32[] memory dids = _rbacs[index].dids;
            uint256 didsLength = dids.length;
            for (uint256 didIndex; didIndex < didsLength; ++didIndex) {
                _grantDidRole(role, dids[didIndex]);
            }
        }

        emit IAccessControlDid.DidAccessControlInitialized(
            rbacsLength,
            _msgSender()
        );
    }

    function _setRoleAdmin(bytes32 _role, bytes32 _adminRole) internal virtual {
        bytes32 previousAdminRole = _getRoleAdmin(_role);
        if (previousAdminRole == _adminRole) return;
        _accessControlStorage().roles[_role].adminRole = _adminRole;
        emit IAccessControlEoa.RoleAdminChanged(
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

        emit IAccessControlEoa.RoleGranted(_role, _account, _msgSender());
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
        if (!_hasEoaRole(_role, _account)) return;

        _accessControlStorage().roles[_role].members.remove(_account);
        _accessControlStorage().rolesByAccount[_account].remove(_role);

        emit IAccessControlEoa.RoleRevoked(_role, _account, _msgSender());
    }

    function _grantDidRole(bytes32 _role, bytes32 _did) internal virtual {
        if (_hasDidRole(_role, _did)) return;

        _accessControlStorage().roles[_role].didMembers.add(_did);
        _accessControlStorage().didRolesByAccount[_did].add(_role);

        emit IAccessControlDid.RoleGrantedToDid(_role, _did, _msgSender());
    }

    function _revokeDidRole(bytes32 _role, bytes32 _did) internal virtual {
        if (!_hasDidRole(_role, _did)) return;

        _accessControlStorage().roles[_role].didMembers.remove(_did);
        _accessControlStorage().didRolesByAccount[_did].remove(_role);

        emit IAccessControlDid.RoleRevokedFromDid(_role, _did, _msgSender());
    }

    function _hasRole(
        bytes32 _role,
        address _account
    ) internal view virtual returns (bool) {
        return
            _hasEoaRole(_role, _account) ||
            _hasDidRole(_role, _resolveDidOf(_account));
    }

    function _hasEoaRole(
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
            IAccessControlEoa.AccountHasNoRole(_account, _role)
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
        revert IAccessControlEoa.AccountHasNoRoles(_account, _roles);
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

    function _hasDidRole(
        bytes32 _role,
        bytes32 _did
    ) internal view virtual returns (bool) {
        return _accessControlStorage().roles[_role].didMembers.contains(_did);
    }

    function _getDidRoleMembersCount(
        bytes32 _role
    ) internal view virtual returns (uint256) {
        return _accessControlStorage().roles[_role].didMembers.length();
    }

    function _getDidRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view virtual returns (bytes32[] memory dids_) {
        return
            _accessControlStorage().roles[_role].didMembers.getFromSet(
                _pageIndex,
                _pageLength
            );
    }

    function _getRolesByDidCount(
        bytes32 _did
    ) internal view virtual returns (uint256) {
        return _accessControlStorage().didRolesByAccount[_did].length();
    }

    function _getRolesByDid(
        bytes32 _did,
        uint256 _pageIndex,
        uint256 _pageLength
    ) internal view virtual returns (bytes32[] memory roles_) {
        return
            _accessControlStorage().didRolesByAccount[_did].getFromSet(
                _pageIndex,
                _pageLength
            );
    }

    /// @notice Resolves an address to its associated DID hash by querying the DidRegistry
    /// @dev CRITICAL: Always queries DidRegistry - no local caching or storage.
    ///      Works for both same-Diamond and cross-Diamond architectures via _getGovernanceAddress():
    ///      - IsbeProxy: queries configurationManager (external resolution)
    ///      - EIP2535AccessControl: queries address(this) (internal Diamond resolution)
    /// @param _account The address to resolve
    /// @return bytes32 The DID hash if found and active, otherwise bytes32(0)
    function _resolveDidOf(address _account) internal view returns (bytes32) {
        return
            _isUseCase() ? _isbeFactoryDidOf(_account) : _localDidOf(_account);
    }

    /// @notice Internal function to resolve DID locally - can be overridden by derived contracts
    /// @dev Default implementation returns bytes32(0), indicating no local DID resolution
    /// @return bytes32 The DID hash if found and active, otherwise bytes32(0)
    function _localDidOf(
        address /* _account */
    ) internal view virtual returns (bytes32) {
        return bytes32(0);
    }

    /// @notice Resolves an address to its associated DID hash using the ISBE factory
    /// @param _account The address to resolve
    /// @return bytes32 The DID hash if found and active, otherwise bytes32(0)
    function _isbeFactoryDidOf(
        address _account
    ) internal view virtual returns (bytes32) {
        return _getIsbeFactory().didOf(_account);
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

    function _checkProtectISBERole(bytes32 _role) internal pure virtual {
        if (_isISBERole(_role)) revert IAccessControlEoa.RoleIsImmutable(_role);
    }

    function _isISBERole(bytes32 _role) internal pure returns (bool) {
        return _role == _ISBE_ROLE;
    }

    function _checkRbacs(IAccessControlEoa.Rbac[] memory _rbacs) private pure {
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
                    IAccessControlEoa.RoleMustBeUnique(_rbacs[index].role)
                );
            }
            if (!adminRoleFound && _rbacs[index].role == _DEFAULT_ADMIN_ROLE) {
                adminRoleFound = true;
            }
            _checkMembers(_rbacs[index].role, _rbacs[index].members);
        }
        if (!adminRoleFound) revert IAccessControlEoa.MissingAdminRole();
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
                    IAccessControlEoa.RoleMemberMustBeUnique(
                        _role,
                        currentMember
                    )
                );
            }
        }
    }
}
