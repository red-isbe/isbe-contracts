// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20Snapshot} from './ERC20Snapshot.sol';
import {
    IEIP2535Introspection
} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC20SnapshotFacet is ERC20Snapshot, IEIP2535Introspection {
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.snapshot.selector;
        selectors_[--selectorsLength] = this.balanceOfAt.selector;
        selectors_[--selectorsLength] = this.totalSupplyAt.selector;
    }
}
