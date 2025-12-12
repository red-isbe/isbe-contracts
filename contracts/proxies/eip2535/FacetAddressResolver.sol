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
