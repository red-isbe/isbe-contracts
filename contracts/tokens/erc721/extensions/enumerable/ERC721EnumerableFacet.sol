// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC721_ENUMERABLE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721Enumerable} from './ERC721Enumerable.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC721EnumerableFacet
 * @notice Facet for ERC721 enumerable extension in diamond/facet architectures.
 * @dev Exposes external interface for token enumeration and querying.
 *      - Should be registered in the diamond with all required selectors.
 */
contract ERC721EnumerableFacet is ERC721Enumerable, IEIP2535Introspection {
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
        businessId_ = _ERC721_ENUMERABLE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.totalSupplyEnumerable.selector;
        selectors_[--selectorsLength] = this.tokenOfOwnerByIndex.selector;
        selectors_[--selectorsLength] = this.tokenByIndex.selector;
    }
}
