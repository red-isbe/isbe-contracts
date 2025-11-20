// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_CLIENT_FILTERING_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {IClientFiltering} from './IClientFiltering.sol';
import {ClientFiltering} from './ClientFiltering.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ClientFilteringFacet is ClientFiltering, IEIP2535Introspection {
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
        businessId_ = _CLIENT_FILTERING_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.registerFilter.selector;
        selectors_[--selectorsLength] = this.updateFilter.selector;
        selectors_[--selectorsLength] = this.getFiltersLength.selector;
        selectors_[--selectorsLength] = this.getFiltersByPage.selector;
        selectors_[--selectorsLength] = this.isFilterRegistered.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IClientFiltering).interfaceId;
    }
}
