// SPDX-License-Identifier: UNLICENSED
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
