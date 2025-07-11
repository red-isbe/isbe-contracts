// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ISBEContext} from '../../utils/ISBEContext.sol';

/**
 * @title FacetAddressResolver
 * @notice Abstract contract for resolving function selectors to facet addresses
 * @dev Provides the core functionality for Diamond proxy facet resolution
 * @author ISBE
 */
abstract contract FacetAddressResolver is ISBEContext {
    /**
     * @notice Thrown when a function selector cannot be resolved to any facet
     * @param _functionSelector The function selector that could not be resolved
     */
    error FunctionNotFound(bytes4 _functionSelector);

    /**
     * @notice Resolves a function selector to its corresponding facet address
     * @dev Must be implemented by inheriting contracts to provide resolution logic
     * @param _signature The function selector to resolve
     * @return facet_ The address of the facet that implements the function
     */
    function _facetAddress(
        bytes4 _signature
    ) internal view virtual returns (address facet_);
}
