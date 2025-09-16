// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {_ERC721_CONSECUTIVE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC721Consecutive} from './ERC721Consecutive.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title ERC721ConsecutiveFacet
/// @notice Facet for ERC721 consecutive minting (EIP-2309) in diamond/facet architectures
/// @dev Exposes external interface for consecutive minting and introspection
contract ERC721ConsecutiveFacet is ERC721Consecutive, IEIP2535Introspection {
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
        businessId_ = _ERC721_CONSECUTIVE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.mintConsecutive.selector;
    }
}
