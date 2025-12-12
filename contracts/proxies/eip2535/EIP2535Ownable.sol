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
*
* Implementation of a diamond.
/******************************************************************************/

import {EIP2535} from './EIP2535.sol';
import {IDiamondCut} from './interfaces/IDiamondCut.sol';
import {OwnableInternal} from '../../access/ownable/OwnableInternal.sol';
import {EIP2535Internal} from './EIP2535Internal.sol';

/**
 * @title EIP2535Ownable Contract
 * @dev Extends the functionality of the EIP-2535 Diamond Standard by incorporating ownership management.
 *      Inherits from `EIP2535` and `OwnableInternal` to provide ownership control and diamond behavior.
 *      This contract simplifies ownership transfer and facet configuration during initialization.
 */
contract EIP2535Ownable is EIP2535, EIP2535Internal, OwnableInternal {
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
        IDiamondCut.ItemCut[] memory _facetCuts,
        DiamondArgs memory _args
    ) payable {
        // Transfer ownership to the specified address
        _transferOwnership(_args.owned);
        // Apply the provided facet cuts and execute initialization logic
        _diamondCut(_facetCuts, _args.init, _args.initCalldata);
        // Additional initialization logic can be added here if needed
    }
}
