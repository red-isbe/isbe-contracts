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

import {_ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643ComplianceDMLim} from './ERC3643ComplianceDMLim.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC3643ComplianceDMLimFacet
 * @notice Facet contract exposing ERC-3643 daily/monthly limits compliance feature and EIP-2535 introspection.
 * @dev Inherits ERC3643ComplianceDMLim and implements IEIP2535Introspection for Diamond compatibility.
 */
contract ERC3643ComplianceDMLimFacet is
    ERC3643ComplianceDMLim,
    IEIP2535Introspection
{
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
        businessId_ = _ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this
            .initializeERC3643ComplianceDMLim
            .selector;
        selectors_[--selectorsLength] = this.setDailyLimit.selector;
        selectors_[--selectorsLength] = this.setMonthlyLimit.selector;
        selectors_[--selectorsLength] = this.dailyLimit.selector;
        selectors_[--selectorsLength] = this.monthlyLimit.selector;
        selectors_[--selectorsLength] = this
            .complianceCheckOnDayMonthLimits
            .selector;
    }
}
