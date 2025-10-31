// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ACCESS_CONTROL_DID_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {AccessControlDid} from './AccessControlDid.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title AccessControlDidFacet
/// @notice Access Control DID Facet smart contract
/// @dev Adds IEIP2535Introspection functionality for DID-based access control
contract AccessControlDidFacet is AccessControlDid, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ACCESS_CONTROL_DID_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 8;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this
            .initializeDidAccessControl
            .selector;
        selectors_[--selectorsLength] = this.grantDidRole.selector;
        selectors_[--selectorsLength] = this.revokeDidRole.selector;
        selectors_[--selectorsLength] = this
            .getRoleMembersCountForDids
            .selector;
        selectors_[--selectorsLength] = this.getDidRoleMembers.selector;
        selectors_[--selectorsLength] = this.getRolesByDidLength.selector;
        selectors_[--selectorsLength] = this.getRolesByDid.selector;
        selectors_[--selectorsLength] = this.hasRoleForDid.selector;
    }
}
