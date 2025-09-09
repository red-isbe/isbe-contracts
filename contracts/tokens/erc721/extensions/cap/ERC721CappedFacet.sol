// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ERC721CappedFacet
 * @notice Facet for ERC721 capped supply functionality in diamond/facet architectures.
 * @dev Exposes external interface for cap management and minting.
 *      - Allows initialization of cap, minting, updating cap, and querying cap value.
 *      - Should be registered in the diamond with all required selectors.
 */

import {_ERC721_CAPPED_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721Capped} from './ERC721Capped.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC721CappedFacet is ERC721Capped, IEIP2535Introspection {
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
        businessId_ = _ERC721_CAPPED_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeCap.selector;
        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.setCap.selector;
        selectors_[--selectorsLength] = this.cap.selector;
    }
}
