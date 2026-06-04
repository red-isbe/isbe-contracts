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

import {GlobalIsbePause} from './GlobalIsbePause.sol';
import {
    _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title Global ISBE Pausable Facet
 * @author ISBE
 * @notice An EIP-2535 facet for the global ISBE pausing mechanism. This
 *         contract exposes pause and unpause functions for use-case proxies.
 * @dev Inherits from `GlobalIsbePause` and implements the standard
 *      EIP-2535 introspection interface. The initialiser is disabled
 *      to ensure it can only be deployed as a facet in a proxy's context.
 */
contract GlobalIsbePauseFacet is GlobalIsbePause {
    constructor() {
        _disableInitializers(_GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY);
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.pauseIsbe.selector;
        selectors_[--selectorsLength] = this.unpauseIsbe.selector;
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }
}
