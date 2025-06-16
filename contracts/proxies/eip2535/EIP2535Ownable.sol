// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com>, Twitter/Github: @mudgen
* EIP-2535 Diamonds
*
* Implementation of a diamond.
/******************************************************************************/

import {EIP2535} from './EIP2535.sol';
import {IDiamondCut} from './interfaces/IDiamondCut.sol';

/**
 * @title EIP2535Ownable Contract
 * @dev Extends the functionality of the EIP-2535 Diamond Standard by incorporating ownership management.
 *      Inherits from `EIP2535` and `OwnableInternal` to provide ownership control and diamond behavior.
 *      This contract simplifies ownership transfer and facet configuration during initialization.
 */
contract EIP2535Ownable is EIP2535 {
    /**
     * @dev Struct to bundle arguments used during the diamond constructor.
     *      This approach helps to prevent "stack too deep" errors by consolidating parameters.
     * @param owned Address of the initial owner of the diamond contract.
     * @param init Address of the contract or initializer used during the diamond's initialization.
     * @param initCalldata Calldata used to execute the initialization logic for the diamond.
     */
    struct DiamondArgs {
        address owned;
        address init;
        bytes initCalldata;
    }

    /**
     * @notice Deploys the diamond contract, sets its ownership, and configures its facets.
     * @dev Initializes diamond ownership with the provided `owned` address and applies the facet cuts in `_facetCuts`.
     *      Executes optional initialization logic with `init` and `initCalldata`.
     * @param _facetCuts Array of `FacetCut` structs to add, replace, or remove function selectors.
     * @param _args Struct with ownership and initialization data for the diamond.
     * @dev Additional logic can be added after `_diamondCut` for extra setup or to initialize state variables.
     */
    constructor(
        IDiamondCut.FacetCut[] memory _facetCuts,
        DiamondArgs memory _args
    ) payable {
        // Transfer ownership to the specified address
        _transferOwnership(_args.owned);
        // Apply the provided facet cuts and execute initialization logic
        _diamondCut(_facetCuts, _args.init, _args.initCalldata);
        // Additional initialization logic can be added here if needed
    }
}
