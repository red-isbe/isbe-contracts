// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IEIP2535Introspection Interface
 * @dev Defines a function to introspect the function selectors supported by the EIP-2535 Diamond Standard interface.
 *      This interface enables tools and developers to retrieve function selectors for compatibility and inspection.
 */
interface IEIP2535Introspection {
    /**
     * @notice Retrieves the interfaces supported by the EIP-2535 Diamond Standard.
     * @dev Returns a static list of interfaces supported by the contract. It is a view function and does not
     *      modify or depend on contract state.
     * @return interfaces_ An array of interface identifiers (`bytes4[]`) compliant with the EIP-165 standard.
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_);

    function businessIdIntrospection()
        external
        pure
        returns (bytes32 businessId_);

    /**
     * @notice Retrieves the function selectors supported by the EIP-2535 Diamond Standard.
     * @dev Returns a static list of function selectors supported by the interface. It is a pure function and does not
     *      modify or depend on contract state.
     * @return selectors_ An array of function selectors (`bytes4[]`) compliant with the EIP-2535 standard.
     */
    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_);
}
