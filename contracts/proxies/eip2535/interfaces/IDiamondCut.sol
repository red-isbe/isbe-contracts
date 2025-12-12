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

import {IDiamond} from './IDiamond.sol';

/**
 * @title IDiamondCut Interface
 * @dev Extends the IDiamond interface and defines functions for adding, replacing, or removing facets
 *      in a modular contract system (Diamond Standard, EIP-2535).
 */
interface IDiamondCut is IDiamond {
    /**
     * @notice Add, replace, or remove any number of functions, and optionally execute
     *         a function with `delegatecall` for initialization or other purposes.
     * @param _diamondCut An array of FacetCut structures, each containing:
     *                    - The facet address to add, replace, or remove.
     *                    - The type of action to perform (add, replace, remove).
     *                    - An array of function selectors to add, replace, or remove.
     * @param _init The address of the contract or facet to execute `_calldata` with `delegatecall`.
     *              Can be used for initialization or setup after a diamond update.
     *              If `_init` is the zero address, no initialization function is called.
     * @param _calldata The data for the function call, including the function selector and arguments.
     *                  This is executed using `delegatecall` on the `_init` address.
     *                  If `_calldata` is empty, no call is executed.
     */
    function diamondCut(
        ItemCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external;

    function interfaceCut(ItemCut[] calldata _interfaceCuts) external;

    /**
     * @notice Update the facets of the diamond by specifying facet addresses,
     *         optionally executing a function with `delegatecall` for initialization or other purposes.
     * @param _newFacetAddresses An array of facet addresses to be updated or initialized.
     * @param _init The address of the contract or facet to execute `_calldata` with `delegatecall`.
     *              If `_init` is the zero address, no initialization function is called.
     * @param _calldata The data for the function call, including the function selector and arguments.
     *                  This is executed using `delegatecall` on the `_init` address.
     *                  If `_calldata` is empty, no call is executed.
     */
    function facetUpdates(
        address[] memory _newFacetAddresses,
        address _init,
        bytes calldata _calldata
    ) external;
}
