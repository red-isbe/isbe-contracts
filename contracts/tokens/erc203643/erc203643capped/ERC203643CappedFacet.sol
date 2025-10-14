// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC203643_CAPPED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC203643Capped} from './ERC203643Capped.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title ERC203643CappedFacet
/// @notice Diamond facet for unified ERC20/ERC3643 capped token functionality
/// @dev Provides supply cap management and minting capabilities for both token standards
contract ERC203643CappedFacet is ERC203643Capped, IEIP2535Introspection {
    /**
     * @dev Returns the interfaces implemented by this facet
     * @return interfaces_ Array of interface identifiers
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @dev Returns the business identifier for this facet
     * @return businessId_ The resolver key for this facet
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC203643_CAPPED_RESOLVER_KEY;
    }

    /**
     * @dev Returns the function selectors exposed by this facet
     * @return selectors_ Array of function selectors
     */
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
