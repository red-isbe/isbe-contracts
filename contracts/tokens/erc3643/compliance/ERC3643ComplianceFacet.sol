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

import {_ERC3643_COMPLIANCE_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC3643Compliance} from './ERC3643Compliance.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643ComplianceFacet is ERC3643Compliance, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory _interfaces)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 _businessId)
    {
        _businessId = _ERC3643_COMPLIANCE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory _selectors)
    {
        uint256 selectorsLength = 6;
        _selectors = new bytes4[](selectorsLength);
        _selectors[--selectorsLength] = this
            .initializeERC3643Compliance
            .selector;
        _selectors[--selectorsLength] = this.setMaxBalanceEnabled.selector;
        _selectors[--selectorsLength] = this.isMaxBalanceEnabled.selector;
        _selectors[--selectorsLength] = this
            .setDailyMonthLimitsEnabled
            .selector;
        _selectors[--selectorsLength] = this.isDailyMonthLimitsEnabled.selector;
        _selectors[--selectorsLength] = this.canTransfer.selector;
    }
}
