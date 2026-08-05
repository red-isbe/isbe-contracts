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
import {
    DidDocumentDetailedInternal
} from '../../../../identity/didregistry/DidDocumentDetailedInternal.sol';
// prettier-ignore
import {
    _ENS_RESOLVER_STORAGE_POSITION // solhint-disable-line no-unused-import
} from '../../../../constants/storagePositions.sol';
import {_ENS_MANAGER_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ENS Resolver Internal Implementation
 * @notice Root internal implementation contract providing core ENS resolver functionality
 * @dev Abstract contract implementing the core logic for ENS resolution with delegation,
 *      approval management, and ENS registry integration. Uses unstructured storage to
 *      enable upgradeable proxy patterns with role-based access control. This serves as
 *      the base for all resolver profile implementations (Name, Text, Pubkey, etc.)
 * @author ISBE Development Team
 */
abstract contract EnsResolverInternal is DidDocumentDetailedInternal {
    /**
     * @notice Storage structure containing all ENS resolver state data
     * @param ens Reference to the ENS registry contract for node ownership verification
     * @param operators Maps owner addresses to operator approvals for comprehensive delegation
     * @param delegates Maps owner addresses to node-specific delegate approvals
     */
    struct EnsResolverStorage {
        ENS ens;
        // owner => operator => approved
        mapping(address => mapping(address => bool)) operators;
        // owner => node => delegate => approved
        mapping(address => mapping(bytes32 => mapping(address => bool))) delegates;
    }

    /**
     * @notice Restricts function access to authorised parties only
     * @dev Validates that the caller is authorised to modify the specified node through
     *      node ownership, operator delegation, node-specific delegation, or ENS manager role
     * @param _node The ENS node hash to check authorisation against
     */
    modifier onlyAuthorised(bytes32 _node) {
        if (!_isAuthorised(_node, _msgSender())) {
            revert IEnsResolver.NotAuthorisedForNode(_node, _msgSender());
        }
        _;
    }

    /**
     * @notice Initialises the ENS resolver with ENS registry reference
     * @dev Internal function establishing connection to ENS registry for ownership verification
     * @param _ensRegistry The ENS registry contract address for resolver integration
     */
    function _initializeEnsResolver(ENS _ensRegistry) internal {
        _ensResolverStorage().ens = _ensRegistry;
    }

    /**
     * @notice Sets operator approval for all caller's ENS nodes
     * @dev Internal function managing comprehensive access control across all nodes
     * @param _owner The address granting or revoking operator permissions
     * @param _operator The address to grant or revoke operator permissions for
     * @param _approved Boolean indicating whether to grant or revoke permissions
     */
    function _setApprovalForAll(
        address _owner,
        address _operator,
        bool _approved
    ) internal {
        _ensResolverStorage().operators[_owner][_operator] = _approved;
    }

    /**
     * @notice Sets delegate approval for a specific ENS node
     * @dev Internal function enabling fine-grained access control for individual nodes
     * @param _owner The address granting or revoking delegate permissions
     * @param _node The ENS node hash to manage delegate permissions for
     * @param _delegate The address to grant or revoke delegate permissions for
     * @param _approved Boolean indicating whether to grant or revoke permissions
     */
    function _approve(
        address _owner,
        bytes32 _node,
        address _delegate,
        bool _approved
    ) internal {
        _ensResolverStorage().delegates[_owner][_node][_delegate] = _approved;
    }

    /**
     * @notice Retrieves the ENS registry contract reference
     * @dev Internal view function providing access to the ENS registry for ownership queries
     * @return The ENS registry contract instance
     */
    function _ens() internal view returns (ENS) {
        return _ensResolverStorage().ens;
    }

    /**
     * @notice Checks if an address has operator permissions for another account
     * @dev Internal view function verifying comprehensive operator status across all nodes
     * @param _account The account address to check operator permissions for
     * @param _operator The address to verify as an operator
     * @return Boolean indicating if operator permissions are granted
     */
    function _isApprovedForAll(
        address _account,
        address _operator
    ) internal view returns (bool) {
        return _ensResolverStorage().operators[_account][_operator];
    }

    /**
     * @notice Checks if an address has delegate permissions for a specific node
     * @dev Internal view function verifying node-specific delegate status
     * @param _owner The owner address to check delegate permissions for
     * @param _node The ENS node hash to verify delegate permissions against
     * @param _delegate The address to verify as a delegate
     * @return Boolean indicating if delegate permissions are granted
     */
    function _isApprovedFor(
        address _owner,
        bytes32 _node,
        address _delegate
    ) internal view returns (bool) {
        return _ensResolverStorage().delegates[_owner][_node][_delegate];
    }

    /**
     * @notice Validates if an address is authorised to modify a specific ENS node
     * @dev Internal view function checking comprehensive authorisation through multiple mechanisms
     * @param _node The ENS node hash to check authorisation against
     * @param _caller The address to validate authorisation for
     * @return Boolean indicating if the caller is authorised for the node
     */
    function _isAuthorised(
        bytes32 _node,
        address _caller
    ) internal view returns (bool) {
        address nodeOwner = _ensResolverStorage().ens.owner(_node);

        return (_caller == nodeOwner ||
            _ensResolverStorage().operators[nodeOwner][_caller] ||
            _ensResolverStorage().delegates[nodeOwner][_node][_caller] ||
            _hasRole(_ENS_MANAGER_ROLE, _caller));
    }

    /**
     * @notice Retrieves the unstructured storage reference for EnsResolver data
     * @dev Private pure function providing access to storage slot using assembly
     * @return storage_ Reference to the EnsResolverStorage struct in storage
     */
    function _ensResolverStorage()
        private
        pure
        returns (EnsResolverStorage storage storage_)
    {
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := _ENS_RESOLVER_STORAGE_POSITION
        }
        // slither-disable-end assembly
    }
}
