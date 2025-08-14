// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidVerificationMethod} from './DidVerificationMethod.sol';
import {IDidVerificationMethod} from './interfaces/IDidVerificationMethod.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_DID_VERIFICATION_METHOD_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

/**
 * @title DID Verification Method Facet
 * @notice Diamond facet providing external access to cryptographic verification method management
 *         for decentralised identifier documents with introspection capabilities
 * @dev Concrete implementation of the diamond facet pattern for verification method operations.
 *      Combines verification method functionality with EIP-2535 interface introspection to
 *      support dynamic discovery of supported interfaces and function selectors
 * @author ISBE Development Team
 */
contract DidVerificationMethodFacet is
    DidVerificationMethod,
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
        businessId_ = _DID_VERIFICATION_METHOD_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.addVerificationMethod.selector;
        selectors_[--selectorsLength] = this.revokeVerificationMethod.selector;
        selectors_[--selectorsLength] = this.expireVerificationMethod.selector;
        selectors_[--selectorsLength] = this.rollVerificationMethod.selector;
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
        interfaces_[--interfacesLength] = type(IDidVerificationMethod)
            .interfaceId;
    }
}
