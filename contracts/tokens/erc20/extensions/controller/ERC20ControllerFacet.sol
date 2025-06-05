// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Controller} from './ERC20Controller.sol';
import {
    IEIP2535Introspection
} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC20ControllerFacet is ERC20Controller, IEIP2535Introspection {
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
