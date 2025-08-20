// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidDocumentDetailed} from './DidDocumentDetailed.sol';
import {IDidDocumentDetailed} from './interfaces/IDidDocumentDetailed.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_DID_DOCUMENT_DETAILED_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

/**
 * @title Decentralised Identity Document Diamond Facet
 * @notice Diamond pattern facet implementation providing DID document management capabilities
 *         within the EIP-2535 modular proxy architecture
 * @dev Combines DID document functionality with diamond introspection capabilities to enable
 *      dynamic contract composition. Implements interface discovery and selector enumeration
 *      for seamless integration with diamond proxy systems and external contract analysis
 * @author ISBE Development Team
 */
contract DidDocumentDetailedFacet is
    DidDocumentDetailed,
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
        businessId_ = _DID_DOCUMENT_DETAILED_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeDiDRegistry.selector;
        selectors_[--selectorsLength] = this.insertDidDocument.selector;
        selectors_[--selectorsLength] = this.updateBaseDocument.selector;
        selectors_[--selectorsLength] = this.getDids.selector;
        selectors_[--selectorsLength] = this.getDidDocument.selector;
        selectors_[--selectorsLength] = this.getDidDocumentByTimestamp.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IDidDocumentDetailed)
            .interfaceId;
    }
}
