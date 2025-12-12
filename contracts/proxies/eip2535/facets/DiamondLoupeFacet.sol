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

// The functions in DiamondLoupeFacet MUST be added to a diamond.
// The EIP-2535 Diamond standard requires these functions.

import {Initializable} from '../../../core/Initializable.sol';
import {EIP2535Internal} from '../EIP2535Internal.sol';
import {ERC165Internal} from '../../../core/ERC165Internal.sol';
import {IDiamondLoupe} from '../interfaces/IDiamondLoupe.sol';
import {IEIP2535Introspection} from '../interfaces/IEIP2535Introspection.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {_DIAMOND_LOUPE_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';

/**
 * @title Diamond Loupe Facet
 * @author ISBE
 * @notice Offers standard EIP-2535 "loupe" functions for inspection.
 * @dev An essential facet for inspecting a diamond's structure.
 *      It implements `IDiamondLoupe` and `IERC165` for discovery.
 *      Callers can view facets, their functions, and addresses.
 *      It also supports `IEIP2535Introspection` to declare its role.
 */
// solhint-disable no-inline-assembly
contract DiamondLoupeFacet is
    IERC165,
    ERC165Internal,
    EIP2535Internal,
    Initializable,
    IDiamondLoupe,
    IEIP2535Introspection
{
    constructor() {
        _disableInitializers(_DIAMOND_LOUPE_RESOLVER_KEY);
    }

    // Diamond Loupe Functions
    ////////////////////////////////////////////////////////////////////
    /// These functions are expected to be called frequently by tools.
    //
    // struct Facet {
    //     address facetAddress;
    //     bytes4[] functionSelectors;
    // }
    /// @notice Gets all facets and their selectors.
    /// @return facets_ Facet
    function facets() external view override returns (Facet[] memory facets_) {
        facets_ = _facets();
    }

    /// @notice Gets all the function selectors supported by a specific facet.
    /// @param _facet The facet address.
    /// @return functionSelectors_ The selectors associated with a facet address.
    function facetFunctionSelectors(
        address _facet
    ) external view override returns (bytes4[] memory functionSelectors_) {
        functionSelectors_ = _facetFunctionSelectors(_facet);
    }

    /// @notice Get all the facet addresses used by a diamond.
    /// @return facetAddresses_
    function facetAddresses()
        external
        view
        override
        returns (address[] memory facetAddresses_)
    {
        facetAddresses_ = _facetAddresses();
    }

    /// @notice Gets the facet address that supports the given selector.
    /// @dev If facet is not found return address(0).
    /// @param _functionSelector The function selector.
    /// @return facetAddress_ The facet address.
    function facetAddress(
        bytes4 _functionSelector
    ) external view override returns (address facetAddress_) {
        facetAddress_ = _facetAddress(_functionSelector);
    }

    /**
     * @notice Retrieves the version of a specific facet key.
     * @param _facetKey The target facet key for which to retrieve the version.
     * @return version_ The initialized version of the specified facet key.
     */
    function facetVersion(
        bytes32 _facetKey
    ) external view returns (uint256 version_) {
        version_ = _getInitializedVersion(_facetKey);
    }

    /**
     * @notice Checks if a contract supports an interface.
     *         Returns false for forbidden interfaces, otherwise checks using ERC-165 method.
     * @param _interfaceId The target interface ID to check support for.
     * @return True if the contract supports the provided interface ID, otherwise false.
     */
    function supportsInterface(
        bytes4 _interfaceId
    ) external view virtual override returns (bool) {
        return
            _isERC165ForbiddenInterfaces(_interfaceId)
                ? false
                : _supportsInterface(_interfaceId);
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _DIAMOND_LOUPE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.facets.selector;
        selectors_[--selectorsLength] = this.facetFunctionSelectors.selector;
        selectors_[--selectorsLength] = this.facetAddresses.selector;
        selectors_[--selectorsLength] = this.facetAddress.selector;
        selectors_[--selectorsLength] = this.supportsInterface.selector;
        selectors_[--selectorsLength] = this.facetVersion.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 2;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IDiamondLoupe).interfaceId;
        interfaces_[--interfacesLength] = type(IERC165).interfaceId;
    }
}
// solhint-enable no-inline-assembly
