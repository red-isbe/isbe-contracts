// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_PAUSE_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {ISBEPause} from './ISBEPause.sol';
import {
    IEIP2535Introspection
} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ISBEPauseFacet is ISBEPause, IEIP2535Introspection {
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
        businessId_ = _PAUSE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializePause.selector;
        selectors_[--selectorsLength] = this.pause.selector;
        selectors_[--selectorsLength] = this.unpause.selector;
        selectors_[--selectorsLength] = this.paused.selector;
        selectors_[--selectorsLength] = this.authorityLevel.selector;
    }
}
