// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC20_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {ERC20} from './ERC20.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC20Facet is ERC20, IEIP2535Introspection {
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC20_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 12;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeErc20.selector;
        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.transferFrom.selector;
        selectors_[--selectorsLength] = this.increaseAllowance.selector;
        selectors_[--selectorsLength] = this.decreaseAllowance.selector;
        selectors_[--selectorsLength] = this.allowance.selector;
        selectors_[--selectorsLength] = this.decimals.selector;
        selectors_[--selectorsLength] = this.symbol.selector;
        selectors_[--selectorsLength] = this.name.selector;
        selectors_[--selectorsLength] = this.totalSupply.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
    }
}
