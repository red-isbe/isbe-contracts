// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _BUSINESS_LOGIC_FACTORY_RESOLVER_KEY
} from '../constants/resolverKeys.sol';
import {BusinessLogicFactory} from './BusinessLogicFactory.sol';
import {
    IEIP2535Introspection
} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract BusinessLogicFactoryFacet is
    BusinessLogicFactory,
    IEIP2535Introspection
{
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _BUSINESS_LOGIC_FACTORY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.deploy.selector;
        selectors_[--selectorsLength] = this.getBusinessLogicAddress.selector;
        selectors_[--selectorsLength] = this.getBusinessLogics.selector;
        selectors_[--selectorsLength] = this.getBusinessLogicVersions.selector;
    }
}
