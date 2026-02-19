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

import {ENS} from './ENS.sol';
import {
    _ENS_REGISTRY_STORAGE_POSITION
} from '../../../constants/storagePositions.sol';
import {_ENS_MANAGER_ROLE} from '../../../constants/roles.sol';
import {
    DidDocumentDetailedInternal
} from '../../didregistry/DidDocumentDetailedInternal.sol';

/**
 * @title ENS Registry Internal Implementation
 * @notice Internal implementation contract providing core ENS domain name management
 * @dev Abstract contract implementing the core logic for decentralised domain name
 *      registry operations including ownership, resolution, and authorisation management.
 *      Uses unstructured storage to enable upgradeable proxy patterns with role-based
 *      access control for administrative operations
 * @author ISBE
 */
abstract contract EnsRegistryInternal is DidDocumentDetailedInternal {
    /**
     * @notice Storage structure containing all ENS registry state data
     * @param owners Maps node hashes to their corresponding owner addresses
     * @param resolvers Maps node hashes to their resolver contract addresses
     * @param ttls Maps node hashes to their time-to-live values in seconds
     * @param operators Maps owner addresses to operator approvals for delegation
     * @param records Maps node hashes to existence flags for explicit record tracking
     */
    struct EnsRegistryStorage {
        // node => owner
        mapping(bytes32 => address) owners;
        // node => resolver
        mapping(bytes32 => address) resolvers;
        // node => ttl
        mapping(bytes32 => uint64) ttls;
        // owner => operator => approved
        mapping(address => mapping(address => bool)) operators;
        // node => exists (opcional para distinguir existencia explícita)
        mapping(bytes32 => bool) records;
    }

    /**
     * @notice Restricts function access to authorised parties only
     * @dev Validates that the caller either owns the node or is an approved operator
     * @param _node The node hash to check authorisation against
     */
    modifier onlyAuthorised(bytes32 _node) {
        _checkAuthorised(_node, _msgSender());
        _;
    }

    function _setRecord(
        bytes32 _node,
        address newOwner,
        address newResolver,
        uint64 newTtl
    ) internal {
        _setOwner(_node, newOwner);
        _setResolver(_node, newResolver);
        _setTTL(_node, newTtl);
    }

    function _setSubnodeRecord(
        bytes32 _node,
        bytes32 _label,
        address newOwner,
        address newResolver,
        uint64 newTtl
    ) internal returns (bytes32 subnode_) {
        subnode_ = _setSubnodeOwner(_node, _label, newOwner);
        _setResolver(subnode_, newResolver);
        _setTTL(subnode_, newTtl);
    }

    function _setSubnodeOwner(
        bytes32 _node,
        bytes32 _label,
        address newOwner
    ) internal returns (bytes32 subnode_) {
        subnode_ = _computeSubnode(_node, _label);
        _setNodeOwner(subnode_, newOwner);
        emit ENS.NewOwner(_node, _label, newOwner);
    }

    function _setResolver(bytes32 _node, address newResolver) internal {
        EnsRegistryStorage storage $ = _ensRegistryStorage();
        $.resolvers[_node] = newResolver;
        $.records[_node] = true;
        emit ENS.NewResolver(_node, newResolver);
    }

    function _setOwner(bytes32 _node, address newOwner) internal {
        _setNodeOwner(_node, newOwner);
        emit ENS.Transfer(_node, newOwner);
    }

    function _setTTL(bytes32 _node, uint64 newTtl) internal {
        EnsRegistryStorage storage $ = _ensRegistryStorage();
        $.ttls[_node] = newTtl;
        $.records[_node] = true;
        emit ENS.NewTTL(_node, newTtl);
    }

    function _setApprovalForAll(
        address ownerAddr,
        address operator,
        bool approved
    ) internal {
        EnsRegistryStorage storage $ = _ensRegistryStorage();
        $.operators[ownerAddr][operator] = approved;
        emit ENS.ApprovalForAll(ownerAddr, operator, approved);
    }

    function _createRootNode(bytes32 _node, address _nodeOwner) internal {
        _setNodeOwner(_node, _nodeOwner);
        emit ENS.Transfer(_node, _nodeOwner);
    }

    function _owner(bytes32 _node) internal view returns (address) {
        return _ensRegistryStorage().owners[_node];
    }

    function _resolver(bytes32 _node) internal view returns (address) {
        return _ensRegistryStorage().resolvers[_node];
    }

    function _ttl(bytes32 _node) internal view returns (uint64) {
        return _ensRegistryStorage().ttls[_node];
    }

    function _recordExists(bytes32 _node) internal view returns (bool) {
        // Alternativa: return _ensRegistryStorage().owners[_node] != address(0);
        return _ensRegistryStorage().records[_node];
    }

    function _isApprovedForAll(
        address ownerAddr,
        address operator
    ) internal view returns (bool) {
        return _ensRegistryStorage().operators[ownerAddr][operator];
    }

    function _isAuthorised(
        bytes32 _node,
        address _caller
    ) internal view returns (bool) {
        address nodeOwner = _owner(_node);
        return (_caller == nodeOwner ||
            _isApprovedForAll(nodeOwner, _caller) ||
            _hasRole(_ENS_MANAGER_ROLE, _caller));
    }

    function _setNodeOwner(bytes32 _node, address newOwner) private {
        EnsRegistryStorage storage $ = _ensRegistryStorage();
        $.owners[_node] = newOwner;
        $.records[_node] = true;
    }

    function _checkAuthorised(bytes32 _node, address _caller) private view {
        require(
            _isAuthorised(_node, _caller),
            ENS.NotAuthorised(_node, _caller)
        );
    }

    function _computeSubnode(
        bytes32 _node,
        bytes32 _label
    ) private pure returns (bytes32) {
        // subnode = keccak256(abi.encodePacked(parentNode, label))
        return keccak256(abi.encodePacked(_node, _label));
    }

    function _ensRegistryStorage()
        private
        pure
        returns (EnsRegistryStorage storage storage_)
    {
        bytes32 position = _ENS_REGISTRY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
