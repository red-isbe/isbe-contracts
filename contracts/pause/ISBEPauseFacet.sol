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

import {_PAUSE_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {ISBEPause} from './ISBEPause.sol';
import {
    IEIP2535Introspection
} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ISBE Pause Facet
 * @author ISBE
 * @notice Provides the external interface and introspection logic for the pausable functionality within a diamond.
 * @dev This contract serves as a facet for an EIP-2535 diamond, implementing the `ISBEPause` interface and the
 * necessary introspection functions from `IEIP2535Introspection`. It exposes the selectors for initialising the
 * pause mechanism, pausing and unpausing the contract, and querying its state. The `businessIdIntrospection`
 * function links this facet to a specific resolver key, identifying its role in the system.
 */
contract ISBEPauseFacet is ISBEPause, IEIP2535Introspection {
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
        businessId_ = _PAUSE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializePause.selector;
        selectors_[--selectorsLength] = this.pause.selector;
        selectors_[--selectorsLength] = this.unpause.selector;
        selectors_[--selectorsLength] = this.paused.selector;
        selectors_[--selectorsLength] = this.authorityLevel.selector;
    }
}
