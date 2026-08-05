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
    _ERC3643_FREEZE_RESOLVER_KEY
} from '../../../../constants/resolverKeys.sol';
import {ERC3643Freeze} from './ERC3643Freeze.sol';
import {
    IEIP2535Introspection
} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643FreezeFacet is ERC3643Freeze, IEIP2535Introspection {
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
        businessId_ = _ERC3643_FREEZE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 8;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.setAddressFrozen.selector;
        selectors_[--selectorsLength] = this.freezePartialTokens.selector;
        selectors_[--selectorsLength] = this.unfreezePartialTokens.selector;
        selectors_[--selectorsLength] = this.batchSetAddressFrozen.selector;
        selectors_[--selectorsLength] = this.batchFreezePartialTokens.selector;
        selectors_[--selectorsLength] = this
            .batchUnfreezePartialTokens
            .selector;
        selectors_[--selectorsLength] = this.isFrozen.selector;
        selectors_[--selectorsLength] = this.getFrozenTokens.selector;
    }
}
