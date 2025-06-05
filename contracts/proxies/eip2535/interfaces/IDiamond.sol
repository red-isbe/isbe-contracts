// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com>, Twitter/Github: @mudgen
* EIP-2535 Diamonds
/******************************************************************************/
/**
 * @title IDiamond Interface
 * @dev Defines the interface for the Diamond Standard (EIP-2535).
 * This interface provides structures, enums, and events required for managing facets
 * in a diamond (a modular and upgradable contract system).
 */
interface IDiamond {
    /**
     * @dev Enum that defines the type of action to perform on a facet.
     * - Add: Add a new facet or selectors to the diamond.
     * - Replace: Replace an existing facet's selectors with new ones.
     * - Remove: Remove a facet's selectors from the diamond.
     */
    enum FacetCutAction {
        Add, // Add a new facet or function selectors (value: 0)
        Replace, // Replace existing function selectors (value: 1)
        Remove // Remove function selectors (value: 2)
    }

    /**
     * @dev Struct used to define a facet and the action to be performed on it.
     * @param facetAddress The address of the facet to be added, replaced, or removed.
     * @param action The action to be performed on the facet (defined by FacetCutAction).
     * @param functionSelectors An array of function selectors to add, replace, or remove.
     */
    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    /**
     * @dev Emitted when the diamond's facets are updated.
     * This event signals changes to the diamond's state (e.g., adding, replacing, or removing facets).
     * @param _diamondCut An array of FacetCut defining the actions performed on facets.
     * @param _init The address of a contract or facet to execute initialization code.
     * @param _calldata The calldata for the initialization function called on `_init`.
     */
    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);
}
