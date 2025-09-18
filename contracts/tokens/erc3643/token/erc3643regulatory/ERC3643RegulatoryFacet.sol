// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_REGULATORY_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643Regulatory} from './ERC3643Regulatory.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643RegulatoryFacet is ERC3643Regulatory, IEIP2535Introspection {
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
        businessId_ = _ERC3643_REGULATORY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeERC3643Regulatory.selector;
        selectors_[--selectorsLength] = this.setIdentityRegistry.selector;
        selectors_[--selectorsLength] = this.setCompliance.selector;
        selectors_[--selectorsLength] = this.identityRegistry.selector;
        selectors_[--selectorsLength] = this.compliance.selector;
    }
}
