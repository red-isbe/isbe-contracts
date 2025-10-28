// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Compliance} from './Compliance.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ComplianceFacet
 * @notice Facet exposing ICompliance methods for Diamond architecture.
 */
contract ComplianceFacet is Compliance, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(ICompliance).interfaceId;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        selectors_ = new bytes4[](4);
        selectors_[0] = this.canTransfer.selector;
        selectors_[1] = this.transferred.selector;
        selectors_[2] = this.created.selector;
        selectors_[3] = this.destroyed.selector;
    }
}