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
    ERC203643InternalCommon
} from '../../../tokens/erc203643/ERC203643InternalCommon.sol';
import {_COMPLIANCE_ROLE} from '../../../constants/roles.sol';

/**
 * @title ERC3643ComplianceBurnTestWrapper
 * @notice Test wrapper to expose internal burn function with COMPLIANCE_ROLE
 * @dev Used exclusively for coverage testing of COMPLIANCE_ROLE bypass logic
 */
contract ERC3643ComplianceBurnTestWrapper is ERC203643InternalCommon {
    /**
     * @notice Exposes internal _burn function for testing with COMPLIANCE_ROLE
     * @dev This function allows testing the compliance bypass path in _handleBurnOperation
     * @param _from The address to burn tokens from
     * @param _amount The amount of tokens to burn
     */
    function testComplianceBurn(
        address _from,
        uint256 _amount
    ) external onlyRole(_COMPLIANCE_ROLE) whenNotPaused {
        _burn(_from, _amount);
    }

    /**
     * @dev Returns the list of ERC165 interface IDs implemented by this contract.
     * @return interfaceIds An empty array since this is a test wrapper
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaceIds)
    {
        interfaceIds = new bytes4[](0);
    }
}
