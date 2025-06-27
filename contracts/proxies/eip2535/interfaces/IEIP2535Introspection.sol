// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title EIP-2535 Introspection Interface
 * @author ISBE
 * @notice Defines introspection functions for EIP-2535 diamonds.
 * @dev Allows callers to discover supported interfaces, selectors,
 *      and a unique business ID, enhancing discoverability.
 */
interface IEIP2535Introspection {
    /**
     * @notice Gets the list of ERC-165 interface IDs the facet supports.
     * @dev A pure function that returns an array of supported `bytes4` IDs.
     * @return interfaces_ An array of supported interface identifiers.
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_);

    /**
     * @notice Retrieves the unique business identifier for this facet.
     * @dev Returns a `bytes32` key identifying the facet's purpose.
     * @return businessId_ The `bytes32` ID for the business logic.
     */
    function businessIdIntrospection()
        external
        pure
        returns (bytes32 businessId_);

    /**
     * @notice Gets all function selectors implemented by this facet.
     * @dev A pure function that returns a `bytes4[]` array of selectors.
     * @return selectors_ An array of `bytes4` function selectors.
     */
    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_);
}
