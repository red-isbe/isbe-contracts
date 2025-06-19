// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EIP2535} from './EIP2535.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';

/**
 * @title EIP2535AccessControl Contract
 * @dev Extends the `EIP2535` abstract contract to provide access control functionality. This contract utilizes
 *      RBAC (Role-Based Access Control) during initialization and supports the configuration of facets in a
 *      diamond contract.
 */
contract EIP2535AccessControl is EIP2535 {
    /**
     * @dev Struct to hold arguments required during the diamond contract's constructor. This helps to avoid
     *      "stack too deep" errors by bundling multiple parameters together.
     * @param rbacs An array of `IAccessControl.Rbac` structures defining role-based access control configurations.
     * @param init The address of the contract or initializer to execute during the diamond's initialization.
     * @param initCalldata The calldata used for the initialization function, typically a function selector and its
     *        encoded arguments.
     */
    struct DiamondArgs {
        IAccessControl.Rbac[] rbacs;
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
        _initializeRbacs(_args.rbacs); // Set up role-based access control
        _configureFacets(_facets, _args.init, _args.initCalldata); // Configure facets and execute initialization logic
    }
}
