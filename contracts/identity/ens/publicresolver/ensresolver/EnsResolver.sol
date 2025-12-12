// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {ENS} from '../../ensregistry/ENS.sol';
import {IEnsResolver} from './IEnsResolver.sol';
import {EnsResolverInternal} from './EnsResolverInternal.sol';
import {_ENS_RESOLVER_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {_ENS_RESOLVER_FACET_VERSION} from '../../../../constants/facetVersions.sol';

/**
 * @title ENS Resolver External Interface
 * @notice External implementation of ENS resolver providing comprehensive delegation and approval management
 * @dev Abstract contract that exposes the IEnsResolver interface whilst delegating core logic to internal
 *      functions. Applies pause protection on write operations, authorisation checks, and
 *      role-based access control for administrative operations. Implements ERC-165 interface
 *      introspection for ENS resolver compatibility
 * @author ISBE Development Team
 */
abstract contract EnsResolver is IEnsResolver, EnsResolverInternal {
    /**
     * @notice Initialises the ENS resolver with ENS registry reference
     * @dev Establishes the connection to the ENS registry for ownership verification
     * @param _ens The ENS registry contract address for resolver integration
     */
    function initializePublicResolver(
        ENS _ens
    )
        external
        override
        addressIsNotZero(address(_ens))
        initializer(_ENS_RESOLVER_RESOLVER_KEY, _ENS_RESOLVER_FACET_VERSION)
    {
        _initializeEnsResolver(_ens);
        emit PublicResolverInitialized(address(_ens));
    }

    /**
     * @notice Grants or revokes operator permissions for all caller's ENS nodes
     * @dev Provides comprehensive access control for resolver operations across all nodes
     * @param operator The address to grant or revoke operator permissions for
     * @param approved Boolean indicating whether to grant or revoke permissions
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) external override whenNotPaused addressIsNotZero(operator) {
        _setApprovalForAll(_msgSender(), operator, approved);
        emit ApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @notice Grants or revokes delegate permissions for a specific ENS node
     * @dev Enables fine-grained access control for individual node operations
     * @param node The ENS node hash to manage delegate permissions for
     * @param delegate The address to grant or revoke delegate permissions for
     * @param approved Boolean indicating whether to grant or revoke permissions
     */
    function approve(
        bytes32 node,
        address delegate,
        bool approved
    )
        external
        override
        whenNotPaused
        addressIsNotZero(delegate)
        onlyAuthorised(node)
    {
        _approve(_ens().owner(node), node, delegate, approved);
        emit Approved(_ens().owner(node), node, delegate, approved);
    }

    /**
     * @notice Checks if an address has operator permissions for another account
     * @dev Verifies comprehensive operator status across all nodes for an account
     * @param account The account address to check operator permissions for
     * @param operator The address to verify as an operator
     * @return isApproved Boolean indicating if operator permissions are granted
     */
    function isApprovedForAll(
        address account,
        address operator
    ) external view override returns (bool isApproved) {
        return _isApprovedForAll(account, operator);
    }

    /**
     * @notice Checks if an address has delegate permissions for a specific node
     * @dev Verifies node-specific delegate status for targeted access control
     * @param owner The owner address to check delegate permissions for
     * @param node The ENS node hash to verify delegate permissions against
     * @param delegate The address to verify as a delegate
     * @return isApproved Boolean indicating if delegate permissions are granted
     */
    function isApprovedFor(
        address owner,
        bytes32 node,
        address delegate
    ) external view override returns (bool isApproved) {
        return _isApprovedFor(owner, node, delegate);
    }

    /**
     * @notice Provides interface introspection support for ENS resolver compatibility
     * @dev Internal pure function enabling ERC-165 interface detection for ENS resolver.
     *      Allows upper layers or facets to announce ENS resolver interface support
     * @return interfaces_ Array containing the ENS resolver interface identifier for introspection
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IEnsResolver).interfaceId;
    }
}
