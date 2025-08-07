// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidController} from './DidController.sol';
import {IDidController} from './interfaces/IDidController.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_DID_CONTROLLER_RESOLVER_KEY} from '../../constants/resolverKeys.sol';
import {
    _CHECK_CONTROLLER_SELECTOR_1,
    _CHECK_CONTROLLER_SELECTOR_2
} from '../../constants/selectors.sol';

/**
 * @title Decentralised Identity Controller Management Facet
 * @notice Diamond pattern facet implementation providing DID controller management capabilities
 *         within the EIP-2535 modular proxy architecture
 * @dev Combines DID controller functionality with diamond introspection capabilities to enable
 *      dynamic contract composition. Implements interface discovery and selector enumeration
 *      for seamless integration with diamond proxy systems and external contract analysis
 * @author ISBE Development Team
 */
contract DidControllerFacet is DidController, IEIP2535Introspection {
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
        businessId_ = _DID_CONTROLLER_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.addController.selector;
        selectors_[--selectorsLength] = this.revokeController.selector;
        selectors_[--selectorsLength] = this.getDidsByController.selector;
        selectors_[--selectorsLength] = _CHECK_CONTROLLER_SELECTOR_1;
        selectors_[--selectorsLength] = _CHECK_CONTROLLER_SELECTOR_2;
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
        interfaces_[--interfacesLength] = type(IDidController).interfaceId;
    }
}
