// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {IAccessControl} from './IAccessControl.sol';
import {_ACCESS_CONTROL_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {_ISBE_ROLE} from '../../constants/roles.sol';

/// @title AccessControl
/// @notice Implements role-based access control mechanisms
/// @dev Inherits from IAccessControl and Common, providing external role management functions
contract AccessControl is IAccessControl, Common {
    modifier protectISBERole(bytes32 _role) {
        _protectISBERole(_role);
        _;
    }
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(_ACCESS_CONTROL_RESOLVER_KEY);
    }

    function initializeAccessControl(
        address admin
    )
        external
        initializer(_ACCESS_CONTROL_RESOLVER_KEY)
        addressIsNotZero(admin)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function grantRole(
        bytes32 role,
        address account
    )
        external
        override
        protectISBERole(role)
        onlyRole(_getRoleAdmin(role))
        whenNotPaused
    {
        _grantRole(role, account);
    }

    function revokeRole(
        bytes32 role,
        address account
    )
        external
        override
        protectISBERole(role)
        onlyRole(_getRoleAdmin(role))
        whenNotPaused
    {
        _revokeRole(role, account);
    }

    function setRoleAdmin(
        bytes32 role,
        bytes32 adminRole
    ) external override onlyRole(_getRoleAdmin(role)) whenNotPaused {
        _setRoleAdmin(role, adminRole);
    }

    function renounceRole(
        bytes32 role
    ) external override protectISBERole(role) whenNotPaused {
        _revokeRole(role, _msgSender());
    }

    function hasRole(
        bytes32 role,
        address account
    ) external view override returns (bool) {
        return _hasRole(role, account);
    }

    function getRoleAdmin(
        bytes32 role
    ) external view override returns (bytes32) {
        return _getRoleAdmin(role);
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

    function _protectISBERole(bytes32 _role) internal pure {
        if (_isISBERole(_role)) revert RoleIsImmutable(_role);
    }

    function _isISBERole(bytes32 _role) internal pure returns (bool) {
        return _role == _ISBE_ROLE;
    }
}
