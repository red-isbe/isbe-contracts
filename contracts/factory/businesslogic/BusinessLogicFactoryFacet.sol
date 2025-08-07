// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_BUSINESS_LOGIC_FACTORY_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {BusinessLogicFactory} from './BusinessLogicFactory.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title BusinessLogicFactoryFacet
 * @author ISBE
 * @notice A facet for a Diamond Proxy that provides the functionality to deploy and manage
 * versioned business logic contracts.
 * @dev This contract is designed to be used as a facet within an EIP-2535 Diamond-compliant
 * proxy. It inherits the logic from `BusinessLogicFactory` and adds the necessary
 * introspection functions (`businessIdIntrospection` and `selectorsIntrospection`) required
 * by the Diamond Standard. These functions allow the proxy to discover which functions
 * this facet exposes and what its unique identifier is.
 */
contract BusinessLogicFactoryFacet is
    BusinessLogicFactory,
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
        businessId_ = _BUSINESS_LOGIC_FACTORY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.deploy.selector;
        selectors_[--selectorsLength] = this.getBusinessLogicAddress.selector;
        selectors_[--selectorsLength] = this.getBusinessLogics.selector;
        selectors_[--selectorsLength] = this.getBusinessLogicVersions.selector;
    }
}
