// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ERC721_TEST_WRAPPER_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC721TestWrapper} from './ERC721TestWrapper.sol';

/**
 * @title ERC721TestWrapperFacet
 * @notice Facet exposing ERC721 test wrapper functions for diamond/facet architectures.
 * @dev Implements diamond introspection and exposes burn, transfer, setApprovalForAll, and baseURI.
 *      - Should be registered in the diamond with all required selectors for test scenarios.
 */
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
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.callSetApprovalForAll.selector;
        selectors_[--selectorsLength] = this.baseURI.selector;
    }
}
