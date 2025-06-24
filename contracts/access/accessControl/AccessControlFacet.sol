// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ACCESS_CONTROL_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {AccessControl} from './AccessControl.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title AccessControlFacet
/// @notice Access Control Facet smart contract
/// @dev Adds IEIP2535Introspection functionality
contract AccessControlFacet is AccessControl, IEIP2535Introspection {
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
        businessId_ = _ACCESS_CONTROL_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 7;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeAccessControl.selector;
        selectors_[--selectorsLength] = this.grantRole.selector;
        selectors_[--selectorsLength] = this.revokeRole.selector;
        selectors_[--selectorsLength] = this.setRoleAdmin.selector;
        selectors_[--selectorsLength] = this.renounceRole.selector;
        selectors_[--selectorsLength] = this.hasRole.selector;
        selectors_[--selectorsLength] = this.getRoleAdmin.selector;
    }
}
