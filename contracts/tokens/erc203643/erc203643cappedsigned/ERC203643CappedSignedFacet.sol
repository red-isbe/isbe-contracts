// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC203543_CAPPED_SIGNED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC203643CappedSigned} from './ERC203643CappedSigned.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC203543 Capped Signed Facet
 * @notice Implements EIP-2535 introspection for the ERC203543 capped signed module
 * @dev Provides interface and selector introspection capabilities for diamond proxy integration.
 *      Inherits ERC203543CappedSigned functionality and implements IEIP2535Introspection.
 * @author [Author or team]
 */
contract ERC203643CappedSignedFacet is
    ERC203643CappedSigned,
    IEIP2535Introspection
{
    /**
     * @notice Returns the list of interfaces implemented by this contract
     * @dev Overrides the base implementation to specify supported interface identifiers
     * @return interfaces_ Array of interface identifiers supported by this contract
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business identifier for this contract module
     * @dev Returns the resolver key constant used to identify this module in the diamond proxy
     * @return businessId_ The business identifier for this contract module
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC203543_CAPPED_SIGNED_RESOLVER_KEY;
    }

    /**
     * @notice Returns the list of function selectors implemented by this contract
     * @dev Overrides the base implementation to specify supported function selectors
     * @return selectors_ Array of function selectors supported by this contract
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.mintWithSignature.selector;
    }
}
