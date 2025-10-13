// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EnsRegistry} from './EnsRegistry.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ENS_REGISTRY_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';

/// @title EnsRegistryFacet
/// @notice Faceta EIP-2535 que expone la funcionalidad del registro ENS
/// @dev Hereda de EnsRegistry y publica introspección de interfaces/negocio/selectores
contract EnsRegistryFacet is EnsRegistry, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        override
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
        businessId_ = _ENS_REGISTRY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 13;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.initialiseEnsRegistry.selector;
        selectors_[--selectorsLength] = this.setRecord.selector;
        selectors_[--selectorsLength] = this.setSubnodeRecord.selector;
        selectors_[--selectorsLength] = this.setSubnodeOwner.selector;
        selectors_[--selectorsLength] = this.setResolver.selector;
        selectors_[--selectorsLength] = this.setOwner.selector;
        selectors_[--selectorsLength] = this.setTTL.selector;
        selectors_[--selectorsLength] = this.setApprovalForAll.selector;
        selectors_[--selectorsLength] = this.owner.selector;
        selectors_[--selectorsLength] = this.resolver.selector;
        selectors_[--selectorsLength] = this.ttl.selector;
        selectors_[--selectorsLength] = this.recordExists.selector;
        selectors_[--selectorsLength] = this.isApprovedForAll.selector;
    }
}
