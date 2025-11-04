// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EnsResolver} from './EnsResolver.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ENS_RESOLVER_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';

/**
 * @title ENS Resolver Facet
 * @notice EIP-2535 facet that exposes the core ENS resolver functionality
 * @dev Inherits from EnsResolver and provides introspection of interfaces, business logic, and selectors
 * @author ISBE Development Team
 */
contract EnsResolverFacet is EnsResolver, IEIP2535Introspection {
    /**
     * @notice Returns the interfaces implemented by this facet
     * @dev Provides ERC-165 interface introspection for ENS resolver compatibility
     * @return interfaces_ Array containing the interface identifiers supported by this facet
     */
    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business identifier for this facet
     * @dev Provides the unique resolver key that identifies this business logic component
     * @return businessId_ The resolver key that uniquely identifies this ENS resolver implementation
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        return _ENS_RESOLVER_RESOLVER_KEY;
    }

    /**
     * @notice Returns the function selectors exposed by this facet
     * @dev Lists all external functions available through this facet for diamond proxy integration
     * @return selectors_ Array of function selectors that this facet makes available
     */
    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.initializePublicResolver.selector;
        selectors_[--selectorsLength] = this.setApprovalForAll.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.isApprovedForAll.selector;
        selectors_[--selectorsLength] = this.isApprovedFor.selector;
    }
}
