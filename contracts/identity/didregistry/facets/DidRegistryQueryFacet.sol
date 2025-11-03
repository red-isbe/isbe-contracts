// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidRegistryQuery} from '../query/DidRegistryQuery.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_DID_REGISTRY_QUERY_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IDidRegistryQuery} from '../interfaces/IDidRegistryQuery.sol';

/// @title DID Registry Query Facet
/// @notice Read-only facet that exposes efficient single-call DID resolution helpers.
/// @dev Implements EIP-2535 introspection and composes internal query helpers.
contract DidRegistryQueryFacet is DidRegistryQuery, IEIP2535Introspection {
    // IEIP2535Introspection
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
        returns (bytes32 businessId_)
    {
        businessId_ = _DID_REGISTRY_QUERY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        selectors_ = new bytes4[](2);
        selectors_[0] = DidRegistryQuery.didOf.selector;
        selectors_[1] = DidRegistryQuery.isKnownDid.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IDidRegistryQuery).interfaceId;
    }
}
