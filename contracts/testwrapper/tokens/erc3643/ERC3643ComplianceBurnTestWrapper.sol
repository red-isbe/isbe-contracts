// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../../../tokens/erc203643/ERC203643InternalCommon.sol';
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
