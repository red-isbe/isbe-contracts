// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_REGULATORY_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643Control} from './ERC3643Control.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643ControlFacet is ERC3643Control, IEIP2535Introspection {
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
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.forcedTransfer.selector;
        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.burn.selector;
    }
}
