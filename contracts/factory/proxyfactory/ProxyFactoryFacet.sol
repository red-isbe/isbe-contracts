// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_PROXY_FACTORY_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {ProxyFactory} from './ProxyFactory.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title Proxy Factory Facet
/// @author ISBE
/// @notice This contract serves as the EIP-2535 Diamond facet for the proxy factory functionality.
///         It exposes all the features of the ProxyFactory through a Diamond proxy.
/// @dev This contract inherits from ProxyFactory and implements the IEIP2535Introspection
///      interface. It is designed to be deployed as a logic contract (facet) that can be
///      added to a Diamond proxy. The constructor disables the initialiser to prevent this
///      implementation contract from being initialised directly; it must be done through
///      the storage context of a proxy.
contract ProxyFactoryFacet is ProxyFactory, IEIP2535Introspection {
    constructor() {
        _disableInitializers(_PROXY_FACTORY_RESOLVER_KEY);
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _PROXY_FACTORY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.deployDiamond.selector;
        selectors_[--selectorsLength] = this
            .getDeployedProxiesByBusinessId
            .selector;
        selectors_[--selectorsLength] = this.getBusinessIdsByProxy.selector;
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }
}
