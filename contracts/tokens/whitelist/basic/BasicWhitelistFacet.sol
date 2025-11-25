// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BasicWhitelist} from './BasicWhitelist.sol';
import {_BASIC_WHITELIST_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title BasicWhitelistFacet
 * @author ISBE
 * @notice Facet contract for BasicWhitelist functionality in ISBE diamond architecture
 * @dev This contract acts as the entry point for the BasicWhitelist functionality in a diamond proxy.
 *      It implements IEIP2535Introspection for diamond-specific introspection capabilities.
 *      Exposes all BasicWhitelist methods and provides selector/interface discovery.
 */
contract BasicWhitelistFacet is BasicWhitelist, IEIP2535Introspection {
    /**
     * @notice Returns the list of interfaces implemented by this facet
     * @dev Used for ERC165 introspection in diamond pattern
     * @return interfaces_ Array of interface IDs implemented by this facet
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business ID (resolver key) for this facet
     * @dev Used by ISBE's BusinessLogicFactory to identify this facet
     * @return businessId_ The resolver key for BasicWhitelist
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _BASIC_WHITELIST_RESOLVER_KEY;
    }

    /**
     * @notice Returns the list of function selectors implemented by this facet
     * @dev Used by diamond to route function calls to the correct facet.
     *      Must include ALL external functions from BasicWhitelist.
     * @return selectors_ Array of 4-byte function selectors
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 7;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeBasicWhitelist.selector;
        selectors_[--selectorsLength] = this.addToWhitelist.selector;
        selectors_[--selectorsLength] = this.removeFromWhitelist.selector;
        selectors_[--selectorsLength] = this.enableWhitelist.selector;
        selectors_[--selectorsLength] = this.disableWhitelist.selector;
        selectors_[--selectorsLength] = this.isWhitelisted.selector;
        selectors_[--selectorsLength] = this.isWhitelistEnabled.selector;
    }
}
