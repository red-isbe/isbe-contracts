// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC721_BURNABLE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721Burnable} from './ERC721Burnable.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC721BurnableFacet
 * @notice Facet for burnable functionality in ERC721 tokens for diamond/facet architectures.
 * @dev Exposes external interface for burning tokens and burning from another account.
 *      - Should be registered in the diamond with all required selectors for burnable logic.
 */
contract ERC721BurnableFacet is ERC721Burnable, IEIP2535Introspection {
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
        businessId_ = _ERC721_BURNABLE_RESOLVER_KEY;
    }

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
