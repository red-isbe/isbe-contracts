// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643ComplianceMaxBal} from './ERC3643ComplianceMaxBal.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC3643ComplianceMaxBalanceFacet
 * @notice Facet contract exposing ERC-3643 MaxBalance compliance feature and EIP-2535 introspection.
 * @dev Inherits ERC3643ComplianceMaxBalance and implements IEIP2535Introspection for Diamond compatibility.
 */
contract ERC3643ComplianceMaxBalanceFacet is
    ERC3643ComplianceMaxBal,
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
        businessId_ = _ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this
            .initializeERC3643ComplianceMaxBalance
            .selector;
        selectors_[--selectorsLength] = this.setMaxBalance.selector;
        selectors_[--selectorsLength] = this.maxBalance.selector;
        selectors_[--selectorsLength] = this
            .complianceCheckOnMaxBalance
            .selector;
    }
}
