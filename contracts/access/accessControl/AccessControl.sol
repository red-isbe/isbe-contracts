// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {IAccessControl} from './IAccessControl.sol';
import {_ACCESS_CONTROL_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {_ISBE_ROLE} from '../../constants/roles.sol';

/// @title AccessControl
/// @notice Implements role-based access control mechanisms
/// @dev Inherits from IAccessControl and Common, providing external role management functions
abstract contract AccessControl is IAccessControl, Common {
    modifier protectISBERole(bytes32 _role) {
        _protectISBERole(_role);
        _;
    }
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(_ACCESS_CONTROL_RESOLVER_KEY);
    }

    function initializeAccessControl(
        IAccessControl.Rbac[] memory _rbacs
    ) external initializer(_ACCESS_CONTROL_RESOLVER_KEY) {
        _initializeRbacs(_rbacs);
    }

    function grantRole(
        bytes32 _role,
        address _account
    )
        external
        override
        protectISBERole(_role)
        onlyRole(_getRoleAdmin(_role))
        whenNotPaused
    {
        _grantRole(_role, _account);
    }

    function revokeRole(
        bytes32 _role,
        address _account
    )
        external
        override
        protectISBERole(_role)
        onlyRole(_getRoleAdmin(_role))
        whenNotPaused
    {
        _revokeRole(_role, _account);
    }

    function setRoleAdmin(
        bytes32 _role,
        bytes32 _adminRole
    ) external override onlyRole(_getRoleAdmin(_role)) whenNotPaused {
        _setRoleAdmin(_role, _adminRole);
    }

    function renounceRole(bytes32 _role) external override whenNotPaused {
        if (_isISBERole(_role)) {
            if (_getRoleMembersCount(_role) < 2) {
                revert AtLeastOneMemberForRole(_role);
            }
        }
        _revokeRole(_role, _msgSender());
    }

    function hasRole(
        bytes32 _role,
        address _account
    ) external view override returns (bool) {
        return _hasRole(_role, _account);
    }

    function getRoleAdmin(
        bytes32 _role
    ) external view override returns (bytes32) {
        return _getRoleAdmin(_role);
    }

    function getRoleMembersCount(
        bytes32 _role
    ) external view override returns (uint256) {
        return _getRoleMembersCount(_role);
    }

    function getRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view override returns (address[] memory members_) {
        return _getRoleMembers(_role, _pageIndex, _pageLength);
    }

    function getRolesByAccountCount(
        address _account
    ) external view override returns (uint256) {
        return _getRolesByAccountCount(_account);
    }

    function getRolesByAccount(
        address _account,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view override returns (bytes32[] memory roles_) {
        return _getRolesByAccount(_account, _pageIndex, _pageLength);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IAccessControl).interfaceId;
    }

    function _protectISBERole(bytes32 _role) internal pure virtual {
        if (_isISBERole(_role)) revert RoleIsImmutable(_role);
    }

    function _isISBERole(bytes32 _role) internal pure returns (bool) {
        return _role == _ISBE_ROLE;
    }
}
