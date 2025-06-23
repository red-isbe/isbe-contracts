// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com>, Twitter/Github: @mudgen
* EIP-2535 Diamonds
/******************************************************************************/

// The functions in DiamondLoupeFacet MUST be added to a diamond.
// The EIP-2535 Diamond standard requires these functions.

import {_DIAMOND_LOUPE_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IDiamondLoupe} from '../interfaces/IDiamondLoupe.sol';
import {IEIP2535Introspection} from '../interfaces/IEIP2535Introspection.sol';
import {EIP2535Internal} from '../EIP2535Internal.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {ERC165Internal} from '../../../core/ERC165Internal.sol';

// solhint-disable no-inline-assembly
contract DiamondLoupeFacet is
    IERC165,
    ERC165Internal,
    EIP2535Internal,
    IDiamondLoupe,
    IEIP2535Introspection
{
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

    function supportsInterface(
        bytes4 interfaceId
    ) external view virtual override returns (bool) {
        if (!_checkERC165ForbiddenInterfaces(interfaceId)) {
            return false;
        }
        return _supportsInterface(interfaceId);
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
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.facets.selector;
        selectors_[--selectorsLength] = this.facetFunctionSelectors.selector;
        selectors_[--selectorsLength] = this.facetAddresses.selector;
        selectors_[--selectorsLength] = this.facetAddress.selector;
        selectors_[--selectorsLength] = this.supportsInterface.selector;
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
