// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ISBE_LOUPE_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IsbeProxyInternal} from '../IsbeProxyInternal.sol';
import {IEIP2535Introspection} from '../../eip2535/interfaces/IEIP2535Introspection.sol';
import {IDiamondLoupe} from '../../eip2535/interfaces/IDiamondLoupe.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {ERC165Internal} from '../../../core/ERC165Internal.sol';

/**
 * @title IsbeLoupeFacet
 * @notice Diamond facet providing introspection capabilities for ISBE proxies
 * @dev Implements Diamond Loupe functions for EIP-2535 compliance with ERC-165 support
 * @author ISBE
 */
contract IsbeLoupeFacet is
    IERC165,
    IDiamondLoupe,
    IsbeProxyInternal,
    ERC165Internal,
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
        return
            _isERC165ForbiddenInterfaces(interfaceId)
                ? _supportsInterface(interfaceId)
                : false;
    }

    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ISBE_LOUPE_RESOLVER_KEY;
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
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 2;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IDiamondLoupe).interfaceId;
        interfaces_[--interfacesLength] = type(IERC165).interfaceId;
    }
}
