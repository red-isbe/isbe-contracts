// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {TrustedIssuersRegistry} from './TrustedIssuersRegistry.sol';
import {ITrustedIssuersRegistry} from './ITrustedIssuersRegistry.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_TRUSTED_ISSUERS_REGISTRY_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

contract TrustedIssuersRegistryFacet is
    TrustedIssuersRegistry,
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
        businessId_ = _TRUSTED_ISSUERS_REGISTRY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 9;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.setAttributeMetadata.selector;
        selectors_[--selectorsLength] = this.setAttributeData.selector;
        selectors_[--selectorsLength] = this.getIssuer.selector;
        selectors_[--selectorsLength] = this.getIssuers.selector;
        selectors_[--selectorsLength] = this.getIssuerAttributes.selector;
        selectors_[--selectorsLength] = this
            .getIssuerAttributeRevisions
            .selector;
        selectors_[--selectorsLength] = this
            .getLatestRevisionAttributeId
            .selector;
        selectors_[--selectorsLength] = this.getRevisionAttribute.selector;
        selectors_[--selectorsLength] = this
            .getLatestRevisionAttribute
            .selector;
    }

    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(ITrustedIssuersRegistry)
            .interfaceId;
    }
}
