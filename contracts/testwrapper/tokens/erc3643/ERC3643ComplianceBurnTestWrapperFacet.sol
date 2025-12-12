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
import {_ERC3643_COMPLIANCE_BURN_TEST_WRAPPER_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC3643ComplianceBurnTestWrapper} from './ERC3643ComplianceBurnTestWrapper.sol';

/**
 * @title ERC3643ComplianceBurnTestWrapperFacet
 * @notice Diamond facet for compliance burn testing
 * @dev Exposes test wrapper functions through diamond proxy
 */
contract ERC3643ComplianceBurnTestWrapperFacet is
    ERC3643ComplianceBurnTestWrapper
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
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC3643_COMPLIANCE_BURN_TEST_WRAPPER_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.testComplianceBurn.selector;
    }
}
