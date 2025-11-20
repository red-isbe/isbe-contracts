// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {IAccessControlDid} from './IAccessControlDid.sol';
import {_ACCESS_CONTROL_DID_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {_ACCESS_CONTROL_DID_FACET_VERSION} from '../../constants/facetVersions.sol';

/// @title AccessControlDid
/// @notice Implements DID-based role access control mechanisms
/// @dev Inherits from IAccessControlDid and Common, providing DID role management functions
abstract contract AccessControlDid is IAccessControlDid, Common {
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(_ACCESS_CONTROL_DID_RESOLVER_KEY);
    }

    function initializeDidAccessControl(
        IAccessControlDid.RbacDid[] memory _rbacs
    )
        external
        virtual
        override
        initializer(
            _ACCESS_CONTROL_DID_RESOLVER_KEY,
            _ACCESS_CONTROL_DID_FACET_VERSION
        )
    {
        _initializeDidAccessControl(_rbacs);
    }

    function grantDidRole(
        bytes32 _role,
        bytes32 _did
    )
        external
        virtual
        override
        protectISBERole(_role)
        onlyRole(_getRoleAdmin(_role))
        whenNotPaused
    {
        _grantDidRole(_role, _did);
    }

    function revokeDidRole(
        bytes32 _role,
        bytes32 _did
    )
        external
        virtual
        override
        protectISBERole(_role)
        onlyRole(_getRoleAdmin(_role))
        whenNotPaused
    {
        _revokeDidRole(_role, _did);
    }

    function getRoleMembersCountForDids(
        bytes32 _role
    ) external view virtual override returns (uint256) {
        return _getDidRoleMembersCount(_role);
    }

    function getDidRoleMembers(
        bytes32 _role,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view virtual override returns (bytes32[] memory dids_) {
        return _getDidRoleMembers(_role, _pageIndex, _pageLength);
    }

    function getRolesByDidLength(
        bytes32 _did
    ) external view virtual override returns (uint256) {
        return _getRolesByDidCount(_did);
    }

    function getRolesByDid(
        bytes32 _did,
        uint256 _pageIndex,
        uint256 _pageLength
    ) external view virtual override returns (bytes32[] memory roles_) {
        return _getRolesByDid(_did, _pageIndex, _pageLength);
    }

    function hasRoleForDid(
        bytes32 _role,
        bytes32 _didHash
    ) external view virtual override returns (bool) {
        return _hasDidRole(_role, _didHash);
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
        interfaces_[--interfacesLength] = type(IAccessControlDid).interfaceId;
    }
}
