// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC712_RESOLVER_KEY} from "../../constants/resolverKeys.sol";
import {ERC712} from "./ERC712.sol";
import {IEIP2535Introspection} from "../../proxies/eip2535/interfaces/IEIP2535Introspection.sol";

/**
 * @title ERC712Facet
 * @dev Facet implementation for EIP-712 typed structured data hashing and signing.
 * Implements the Diamond (EIP-2535) introspection pattern.
 *
 * USAGE:
 * This facet must be added to a Diamond proxy that already has a token implementation
 * (ERC20, ERC721, or ERC3643) deployed. The facet provides meta-transaction capabilities
 * allowing sponsors to execute transfer, mint, and burn operations on behalf of signers
 * who have signed EIP-712 typed messages.
 *
 * INHERITANCE:
 * ERC712Facet → ERC712 → ERC203643InternalCommon → ERC712Internal
 *
 * EXPOSED FUNCTIONS:
 * - initializeErc712: Initialize EIP-712 domain
 * - DOMAIN_SEPARATOR: Get domain separator
 * - nonces: Get nonce for replay protection
 * - eip712Domain: Get EIP-712 domain fields (EIP-5267)
 * - transferBySponsor: Execute transfer with signature
 * - mintBySponsor: Execute mint with signature
 * - burnBySponsor: Execute burn with signature
 */
contract ERC712Facet is ERC712, IEIP2535Introspection {
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
        businessId_ = _ERC712_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 7;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeErc712.selector;
        selectors_[--selectorsLength] = this.DOMAIN_SEPARATOR.selector;
        selectors_[--selectorsLength] = this.nonces.selector;
        selectors_[--selectorsLength] = this.eip712Domain.selector;
        selectors_[--selectorsLength] = this.transferBySponsor.selector;
        selectors_[--selectorsLength] = this.mintBySponsor.selector;
        selectors_[--selectorsLength] = this.burnBySponsor.selector;
    }
}
