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

import {_ERC721_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {
    _SAFE_TRANSFER_FROM_SELECTOR_1,
    _SAFE_TRANSFER_FROM_SELECTOR_2
} from '../../constants/selectors.sol';
import {ERC721} from './ERC721.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC721Facet
 * @notice Facet for ERC721 functionality in a diamond architecture. Exposes ERC721 external interface and selectors.
 * @dev Implements ERC721 standard functions and diamond-specific introspection.
 *      - Exposes ERC721 methods.
 *      - Implements IEIP2535Introspection for selector and interface discovery.
 *      - Uses resolver key for diamond businessId identification.
 */
contract ERC721Facet is ERC721, IEIP2535Introspection {
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
        businessId_ = _ERC721_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 13;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeErc721.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.setApprovalForAll.selector;
        selectors_[--selectorsLength] = this.transferFrom.selector;
        selectors_[--selectorsLength] = _SAFE_TRANSFER_FROM_SELECTOR_1;
        selectors_[--selectorsLength] = _SAFE_TRANSFER_FROM_SELECTOR_2;
        selectors_[--selectorsLength] = this.tokenURI.selector;
        selectors_[--selectorsLength] = this.name.selector;
        selectors_[--selectorsLength] = this.symbol.selector;
        selectors_[--selectorsLength] = this.ownerOf.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
        selectors_[--selectorsLength] = this.getApproved.selector;
        selectors_[--selectorsLength] = this.isApprovedForAll.selector;
    }
}
