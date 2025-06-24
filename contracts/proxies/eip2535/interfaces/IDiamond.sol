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
    enum ItemCutAction {
        Add, // Add a new interface (value: 0)
        Replace, // Replace existing function selectors (value: 1)
        Remove // Remove interface (value: 2)
    }

    enum ItemsType {
        Selectors,
        Interfaces
    }

    struct ItemCut {
        address facetAddress;
        ItemCutAction action;
        bytes4[] items;
    }

    /**
     * @dev Emitted when the diamond's facets are updated.
     * This event signals changes to the diamond's state (e.g., adding, replacing, or removing facets).
     * @param _diamondCut An array of FacetCut defining the actions performed on facets.
     * @param _init The address of a contract or facet to execute initialization code.
     * @param _calldata The calldata for the initialization function called on `_init`.
     */
    event DiamondCut(ItemCut[] _diamondCut, address _init, bytes _calldata);

    /**
     * @dev Emitted when the diamond's interfaces are updated.
     * This event signals changes to the diamond's state (e.g., adding, replacing or removing interfaces).
     * @param _interfaceCut An array of InterfaceCut defining the actions performed on interfaces.
     */
    event InterfacesUpdate(ItemCut[] _interfaceCut);
}
