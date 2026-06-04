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

import {AnchoringCore} from './AnchoringCore.sol';
import {_ANCHORING_CORE_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title AnchoringCoreFacet
 * @author ISBE Team
 * @notice Diamond facet for cross-chain anchoring functionality
 * @dev Provides cross-chain block anchoring capabilities within the Diamond architecture,
 *      enabling the diamond to securely anchor and retrieve block metadata from multiple external chains.
 *      Implements IEIP2535Introspection for diamond introspection and function selector discovery.
 */
contract AnchoringCoreFacet is AnchoringCore, IEIP2535Introspection {
    constructor() {
        _disableInitializers(_ANCHORING_CORE_RESOLVER_KEY);
    }

    function interfacesIntrospection()
        external
        pure
        override
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
        businessId_ = _ANCHORING_CORE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 11;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.registerChain.selector;
        selectors_[--selectorsLength] = this.anchorBlock.selector;
        selectors_[--selectorsLength] = this.anchorBlocksBatch.selector;
        selectors_[--selectorsLength] = this.getLastAnchoredBlock.selector;
        selectors_[--selectorsLength] = this.getAnchoredBlock.selector;
        selectors_[--selectorsLength] = this.isBlockAnchored.selector;
        selectors_[--selectorsLength] = this.getLastNBlocks.selector;
        selectors_[--selectorsLength] = this.getBlocksInRange.selector;
        selectors_[--selectorsLength] = this.getAnchoringStats.selector;
        selectors_[--selectorsLength] = this.getChainMetadata.selector;
        selectors_[--selectorsLength] = this.getRegisteredChains.selector;
    }
}
