// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ERC721_TEST_WRAPPER_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC721TestWrapper} from './ERC721TestWrapper.sol';

contract ERC721TestWrapperFacet is ERC721TestWrapper, IEIP2535Introspection {
    // Introspection for diamond pattern
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
        businessId_ = _ERC721_TEST_WRAPPER_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.burn.selector;
        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.callSetApprovalForAll.selector;
        selectors_[--selectorsLength] = this.baseURI.selector;
        //selectors_[--selectorsLength] = this.safeTransferFrom.selector;
    }
}
