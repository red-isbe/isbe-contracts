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

import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_DIAMOND_LOUPE_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

/**
 * @title DiamondLoupeFacetReducedMock
 * @author ISBE
 * @notice New version of DiamondLoupeFacet that only keeps `supportsInterface`.
 * @dev Used by the diamond upgrade tests: installing it would remove the loupe functions,
 *      so the upgrade tool must refuse it even when removals are allowed.
 */
contract DiamondLoupeFacetReducedMock is IEIP2535Introspection {
    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }

    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](0);
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
        selectors_ = new bytes4[](1);
        selectors_[0] = this.supportsInterface.selector;
    }
}
