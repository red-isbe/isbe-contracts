// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC3643_METADATA_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC3643Metadata} from './ERC3643Metadata.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract ERC3643MetadataFacet is ERC3643Metadata, IEIP2535Introspection {
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
        businessId_ = _ERC3643_METADATA_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeERC3643Metadata.selector;
        selectors_[--selectorsLength] = this.setName.selector;
        selectors_[--selectorsLength] = this.setSymbol.selector;
        selectors_[--selectorsLength] = this.setOnchainID.selector;
        selectors_[--selectorsLength] = this.onchainID.selector;
        selectors_[--selectorsLength] = this.version.selector;
        // selectors_[--selectorsLength] = this.businessIdIntrospection.selector;
        // selectors_[--selectorsLength] = this.interfacesIntrospection.selector;
        // selectors_[--selectorsLength] = this.selectorsIntrospection.selector;
    }
}
