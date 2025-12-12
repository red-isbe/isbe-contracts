// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com>, Twitter/Github: @mudgen
* EIP-2535 Diamonds
/******************************************************************************/

/**
 * @title IDiamondLoupe Interface
 * @dev Implements a set of view-only functions to inspect and analyze the structure of a diamond contract.
 *      Inspired by the concept of a loupe—a magnifying glass used to examine diamonds.
 *      These functions allow tools and developers to retrieve information about diamond facets and their selectors.
 * @notice This interface is a required part of the Diamond Standard (EIP-2535).
 */
interface IDiamondLoupe {
    /**
     * @dev Represents a facet in the diamond.
     * @param facetAddress The address of the facet contract.
     * @param functionSelectors An array of function selectors supported by the facet.
     */
    struct Facet {
        address facetAddress;
        bytes4[] functionSelectors;
    }

    /**
     * @notice Retrieves all facet addresses along with their respective four-byte function selectors.
     * @return facets_ An array of `Facet` structures containing:
     *                 - `facetAddress`: The address of the facet.
     *                 - `functionSelectors`: The function selectors it supports.
     */
    function facets() external view returns (Facet[] memory facets_);

    /**
     * @notice Retrieves all function selectors supported by a specific facet.
     * @param _facet The address of the facet to query.
     * @return facetFunctionSelectors_ An array of function selectors (as `bytes4`) supported by the specified facet.
     */
    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_);

    /**
     * @notice Retrieves all facet addresses currently used by the diamond.
     * @return facetAddresses_ An array of addresses representing the facets in the diamond.
     */
    function facetAddresses()
        external
        view
        returns (address[] memory facetAddresses_);

    /**
     * @notice Retrieves the facet address associated with a given function selector.
     * @dev If no facet supports the selector, the function will return the zero address (`address(0)`).
     * @param _functionSelector The function selector to query.
     * @return facetAddress_ The address of the facet that supports the selector, or `address(0)` if not found.
     */
    function facetAddress(
        bytes4 _functionSelector
    ) external view returns (address facetAddress_);

    /**
     * @notice Retrieves the version of a specific facet key.
     * @param _facetKey The target facet key for which to retrieve the version.
     * @return version_ The initialized version of the specified facet key.
     */
    function facetVersion(
        bytes32 _facetKey
    ) external view returns (uint256 version_);
}
