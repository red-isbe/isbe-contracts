// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC721_ROYALTY_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721Royalty} from './ERC721Royalty.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC721RoyaltyFacet
 * @notice Facet for ERC721 royalty functionality in diamond/facet architectures.
 * @dev Exposes external interface for royalty management and queries.
 *      - Allows setting and querying royalties, fee denominator, and related logic.
 *      - Should be registered in the diamond with all required selectors.
 */
contract ERC721RoyaltyFacet is ERC721Royalty, IEIP2535Introspection {
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
        businessId_ = _ERC721_ROYALTY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 7;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.royaltyInfo.selector;
        selectors_[--selectorsLength] = this.setDefaultRoyalty.selector;
        selectors_[--selectorsLength] = this.deleteDefaultRoyalty.selector;
        selectors_[--selectorsLength] = this.setTokenRoyalty.selector;
        selectors_[--selectorsLength] = this.resetTokenRoyalty.selector;
        selectors_[--selectorsLength] = this.setFeeDenominator.selector;
        selectors_[--selectorsLength] = this.feeDenominator.selector;
    }
}
