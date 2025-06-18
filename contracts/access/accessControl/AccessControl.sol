// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from './IAccessControl.sol';
import {Common} from '../../core/Common.sol';
import {_ACCESS_CONTROL_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

/// @title AccessControl
/// @notice Implements role-based access control mechanisms
/// @dev Inherits from IAccessControl and Common, providing external role management functions
contract AccessControl is IAccessControl, IERC165, Common {
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
    ) external override onlyRole(_getRoleAdmin(role)) whenNotPaused {
        _grantRole(role, account);
    }

    function revokeRole(
        bytes32 role,
        address account
    ) external override onlyRole(_getRoleAdmin(role)) whenNotPaused {
        _revokeRole(role, account);
    }

    function setRoleAdmin(
        bytes32 role,
        bytes32 adminRole
    ) external override onlyRole(_getRoleAdmin(role)) whenNotPaused {
        _setRoleAdmin(role, adminRole);
    }

    function renounceRole(bytes32 role) external override whenNotPaused {
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

    function supportsInterface(
        bytes4 interfaceId
    ) external view virtual override returns (bool) {
        return
            _supportsERC165Interface(interfaceId) ||
            _supportsInterface(interfaceId, _accessControlInterfaces());
    }

    function _accessControlInterfaces()
        internal
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IAccessControl).interfaceId;
    }
}
