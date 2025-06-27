// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    IEIP2535Introspection
} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_RESOLVER_KEY, CounterFacetInternal} from './CounterFacetInternal.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../../constants/roles.sol';

contract CounterV2FacetTestWrapper is
    CounterFacetInternal,
    IEIP2535Introspection
{
    constructor() {
        _disableInitializers(_RESOLVER_KEY);
    }

    function initializeCounter(
        uint256 startingValue
    ) external initializer(_RESOLVER_KEY) {
        CounterStorage storage $ = _counterStorage();
        $.counter = startingValue;
    }

    function increment(
        uint256 amount
    ) external whenNotPaused onlyRole(_DEFAULT_ADMIN_ROLE) {
        _counterStorage().counter += amount;
    }

    function counter() external view returns (uint256) {
        return _counterStorage().counter;
    }

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
        businessId_ = _RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeCounter.selector;
        selectors_[--selectorsLength] = this.increment.selector;
        selectors_[--selectorsLength] = this.counter.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        return new bytes4[](0);
    }
}
