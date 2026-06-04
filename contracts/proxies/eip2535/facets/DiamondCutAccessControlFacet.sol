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

import {_DIAMOND_CUT_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IDiamondCut} from '../interfaces/IDiamondCut.sol';
import {EIP2535Internal} from '../EIP2535Internal.sol';
import {IEIP2535Introspection} from '../interfaces/IEIP2535Introspection.sol';
import {
    AccessControlInternal
} from '../../../access/accessControl/AccessControlInternal.sol';
import {_GOVERNANCE_MANAGER_ROLE} from '../../../constants/roles.sol';

/**
 * @title Diamond Cut Access Control Facet
 * @author ISBE
 * @notice Manages the diamond's structure via role-based facet updates.
 * @dev A facet for EIP-2535 diamond cuts, secured by access control.
 *      It implements `IDiamondCut` and uses `AccessControlInternal`.
 *      Only accounts with `DEFAULT_ADMIN_ROLE` can perform modifications.
 *      It also complies with `IEIP2535Introspection` for discovery.
 */
contract DiamondCutAccessControlFacet is
    IDiamondCut,
    EIP2535Internal,
    AccessControlInternal,
    IEIP2535Introspection
{
    /// @notice Add/replace/remove any number of functions and optionally execute
    ///         a function with delegatecall
    /// @param _facetCuts Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    ///                  _calldata is executed with delegatecall on _init
    function diamondCut(
        ItemCut[] calldata _facetCuts,
        address _init,
        bytes calldata _calldata
    ) external override onlyRole(_GOVERNANCE_MANAGER_ROLE) whenNotPaused {
        _diamondCut(_facetCuts, _init, _calldata);
    }

    function interfaceCut(
        ItemCut[] calldata _interfaceCuts
    ) external override onlyRole(_GOVERNANCE_MANAGER_ROLE) whenNotPaused {
        _interfaceCut(_interfaceCuts);
    }

    function facetUpdates(
        address[] memory _facetAddresses,
        address _init,
        bytes calldata _calldata
    ) external override onlyRole(_GOVERNANCE_MANAGER_ROLE) whenNotPaused {
        _facetUpdates(_facetAddresses, _init, _calldata);
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IDiamondCut).interfaceId;
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _DIAMOND_CUT_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.diamondCut.selector;
        selectors_[--selectorsLength] = this.interfaceCut.selector;
        selectors_[--selectorsLength] = this.facetUpdates.selector;
    }
}
