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

import {EIP2535Internal} from './EIP2535Internal.sol';
import {
    AccessControlInternal
} from '../../access/accessControl/AccessControlInternal.sol';
import {EIP2535} from './EIP2535.sol';
import {IAccessControlEoa} from '../../access/accessControl/IAccessControl.sol';

/**
 * @title EIP2535AccessControl Contract
 * @dev Extends the `EIP2535` abstract contract to provide access control functionality. This contract utilizes
 *      RBAC (Role-Based Access Control) during initialization and supports the configuration of facets in a
 *      diamond contract.
 */
contract EIP2535AccessControl is
    EIP2535,
    EIP2535Internal,
    AccessControlInternal
{
    /**
     * @dev Struct to hold arguments required during the diamond contract's constructor. This helps to avoid
     *      "stack too deep" errors by bundling multiple parameters together.
     * @param rbacs An array of `IAccessControl.Rbac` structures defining role-based access control configurations.
     * @param init The address of the contract or initializer to execute during the diamond's initialization.
     * @param initCalldata The calldata used for the initialization function, typically a function selector and its
     *        encoded arguments.
     */
    struct DiamondArgs {
        IAccessControlEoa.Rbac[] rbacs;
        address init;
        bytes initCalldata;
    }

    /**
     * @notice Initializes a new diamond contract instance with facets and access control configurations.
     * @dev This constructor is invoked during the deployment of the diamond contract. It performs two main tasks:
     *      - Calls `_initializeRbac` to set up role-based access control using the `rbacs` parameter.
     *      - Calls `_configureFacets` to set up the diamond's facets and optionally execute an initialization
     *        function.
     * @param _facets An array of addresses representing the facets to be added to the diamond.
     * @param _args Struct containing diamond initialization arguments (`DiamondArgs`).
     */
    constructor(address[] memory _facets, DiamondArgs memory _args) payable {
        // Set up role-based access control
        _initializeRbacs(_args.rbacs);
        // Configure facets and execute initialization logic
        _configureFacets(_facets, _args.init, _args.initCalldata);
    }
}
