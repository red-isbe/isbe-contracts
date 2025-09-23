// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_PROXY_FACTORY_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {ProxyFactory} from './ProxyFactory.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_PROXY_FACTORY_VERSION} from '../../constants/facetVersions.sol';

/**
 * @title Proxy Factory Facet
 * @author ISBE
 * @notice EIP-2535 diamond facet for proxy factory functionality
 * @dev Inherits from ProxyFactory and implements IEIP2535Introspection
 *      interface. Designed to be deployed as a logic contract (facet) that
 *      can be added to a diamond proxy. The constructor disables the
 *      initialiser to prevent direct initialisation of this implementation
 */
contract ProxyFactoryFacet is ProxyFactory, IEIP2535Introspection {
    constructor() {
        _disableInitializers(
            _PROXY_FACTORY_RESOLVER_KEY,
            _PROXY_FACTORY_VERSION
        );
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
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.deployUseCase.selector;
        selectors_[--selectorsLength] = this.deployUseCaseTo.selector;
        selectors_[--selectorsLength] = this
            .getDeployedProxiesByConfiguration
            .selector;
        selectors_[--selectorsLength] = this.getConfigurationByProxy.selector;
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }
}
