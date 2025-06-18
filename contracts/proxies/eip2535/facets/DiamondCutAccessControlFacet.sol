// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com>, Twitter/Github: @mudgen
* EIP-2535 Diamonds
/******************************************************************************/

import {_DIAMOND_CUT_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IDiamondCut} from '../interfaces/IDiamondCut.sol';
import {EIP2535Internal} from '../EIP2535Internal.sol';
import {IEIP2535Introspection} from '../interfaces/IEIP2535Introspection.sol';

// Remember to add the loupe functions from DiamondLoupeFacet to the diamond.
// The loupe functions are required by the EIP2535 Diamonds standard

contract DiamondCutAccessControlFacet is
    IDiamondCut,
    EIP2535Internal,
    IEIP2535Introspection
{
    /// @notice Add/replace/remove any number of functions and optionally execute
    ///         a function with delegatecall
    /// @param _facetCuts Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    ///                  _calldata is executed with delegatecall on _init
    function diamondCut(
        FacetCut[] calldata _facetCuts,
        address _init,
        bytes calldata _calldata
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        _diamondCut(_facetCuts, _init, _calldata);
    }

    function facetUpdates(
        address[] memory _facetAddresses,
        address _init,
        bytes calldata _calldata
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
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
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.diamondCut.selector;
        selectors_[--selectorsLength] = this.facetUpdates.selector;
    }
}
