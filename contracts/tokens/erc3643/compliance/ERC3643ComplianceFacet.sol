// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_COMPLIANCE_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC3643Compliance} from './ERC3643Compliance.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643ComplianceFacet is ERC3643Compliance, IEIP2535Introspection {
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
        businessId_ = _ERC3643_COMPLIANCE_RESOLVER_KEY;
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
            .initializeERC3643Compliance
            .selector;
        selectors_[--selectorsLength] = this.setMaxBalanceEnabled.selector;
        selectors_[--selectorsLength] = this.isMaxBalanceEnabled.selector;
        selectors_[--selectorsLength] = this
            .setDailyMonthLimitsEnabled
            .selector;
        selectors_[--selectorsLength] = this.isDailyMonthLimitsEnabled.selector;
        selectors_[--selectorsLength] = this.canTransfer.selector;
    }
}
