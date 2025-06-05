// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Burnable} from './ERC20Burnable.sol';
import {
    IEIP2535Introspection
} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC20BurnableFacet is ERC20Burnable, IEIP2535Introspection {
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.burn.selector;
        selectors_[--selectorsLength] = this.burnFrom.selector;
    }
}
