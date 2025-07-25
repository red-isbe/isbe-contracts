// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC20_CONTROLLER_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC20Controller} from './ERC20Controller.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC20ControllerFacet is ERC20Controller, IEIP2535Introspection {
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
        businessId_ = _ERC20_CONTROLLER_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.forceTransfer.selector;
        selectors_[--selectorsLength] = this.forceBurn.selector;
    }
}
