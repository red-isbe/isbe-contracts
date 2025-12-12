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

import {
    NetworkData,
    UpdateNetworkData,
    NetworkStorageData,
    Resource,
    Stage,
    Algorithm,
    InvalidStage,
    InvalidAlgorithm,
    DuplicatedResource,
    NetworkNotFound,
    NetworkAlreadyExists,
    ResourceNotFound,
    _fromNetworkDataToNetworkStorageData
} from './Types.sol';
import {DidDocumentDetailedInternal} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {_NETWORK_DIRECTORY_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @title NetworkDirectoryInternal
 * @notice Internal implementation of network directory operations using diamond storage pattern
 * @dev This contract provides the core business logic for network directory management.
 *      Uses diamond storage pattern to avoid storage collisions in proxy contracts.
 *      All functions are internal and should be called through the external layer.
 * @author ISBE Development Team
 */
abstract contract NetworkDirectoryInternal is DidDocumentDetailedInternal {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    /**
     * @notice Holds network data and associated resources for a specific chain ID
     * @param network The stored network data structure
     * @param resourceIds Set of resource identifiers associated with this chain ID
     * @param resources Mapping of resource identifiers to their string values
     */
    struct ChainIdData {
        NetworkStorageData network;
        EnumerableSet.Bytes32Set resourceIds;
        mapping(bytes32 resourceId => string resource) resources;
    }

    /**
     * @notice Main storage structure for network directory data
     * @param chainIds Set of registered chain identifiers
     * @param networksByAlgorithm Mapping of algorithms to network counts
     * @param networkData Mapping of chain IDs to their associated ChainIdData
     */
    struct NetworkDirectoryStorage {
        EnumerableSet.UintSet chainIds;
        mapping(Algorithm algorihm => uint256 length) networksByAlgorithm;
        mapping(uint256 chainId => ChainIdData data) networkData;
    }

    /**
     * @notice Ensures a network exists before operations
     * @dev Checks if chainId exists in storage by verifying stored chainId is not zero
     * @param chainId The network identifier to validate
     */
    modifier onlyExistentNetwork(uint256 chainId) {
        _checkNetworkExists(chainId);
        _;
    }

    /**
     * @notice Ensures a network does not exist before operations
     * @dev Checks if chainId is not registered by verifying stored chainId is zero
     * @param chainId The network identifier to validate
     */
    modifier onlyNonExistentNetwork(uint256 chainId) {
        _checkNetworkDoesNotExist(chainId);
        _;
    }

    /**
     * @notice Ensures a resource exists for a network before operations
     * @dev Validates that the specified resourceId is associated with the chainId
     * @param chainId The network identifier
     * @param resourceId The resource identifier to validate
     */
    modifier onlyExistentResource(uint256 chainId, bytes32 resourceId) {
        _checkResourceExists(chainId, resourceId);
        _;
    }

    /**
     * @notice Modifier to validate network data before creation or updates
     * @dev Performs comprehensive validation of all network fields
     * @param network The network data to validate
     * @custom:throws Various validation errors for invalid network data
     */
    modifier validateCreateNetworkData(NetworkData calldata network) {
        _validateCreateNetworkData(network);
        _;
    }

    /**
     * @notice Ensures a resource exists for a network before operations
     * @dev Validates that the specified resourceId is associated with the chainId
     * @param network The network data to validate
     * @custom:throws Various validation errors for invalid network data
     */
    modifier validateUpdateNetworkData(UpdateNetworkData calldata network) {
        _validateUpdateNetworkData(network);
        _;
    }

    // -------- Internal actions --------
    function _createNetwork(NetworkData calldata network) internal {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        $.chainIds.add(network.chainId);
        unchecked {
            ++$.networksByAlgorithm[network.algorithm];
        }
        ChainIdData storage chainIdData = $.networkData[network.chainId];
        chainIdData.network = _fromNetworkDataToNetworkStorageData(network);
        uint256 length = network.resources.length;
        for (uint256 index; index < length; ) {
            _setResource(
                chainIdData,
                network.resources[index].resourceId,
                network.resources[index].resource
            );
            unchecked {
                ++index;
            }
        }
    }

    function _updateNetwork(UpdateNetworkData calldata network) internal {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        NetworkStorageData storage storedNetwork = $
            .networkData[network.chainId]
            .network;

        storedNetwork.name = network.name;
        storedNetwork.algorithm = network.algorithm;
        unchecked {
            --$.networksByAlgorithm[storedNetwork.algorithm];
            ++$.networksByAlgorithm[network.algorithm];
        }
        storedNetwork.symbol = network.symbol;
        storedNetwork.stage = network.stage;
    }

    function _deleteNetwork(uint256 chainId) internal {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        $.chainIds.remove(chainId);
        ChainIdData storage data = $.networkData[chainId];
        unchecked {
            --$.networksByAlgorithm[data.network.algorithm];
        }
        delete data.network;
        uint256 index = data.resourceIds.length();
        while (index > 0) {
            unchecked {
                --index;
            }
            bytes32 resourceId = data.resourceIds.at(index);
            delete data.resources[resourceId];
            data.resourceIds.remove(resourceId);
        }
    }

    function _setResource(
        uint256 chainId,
        bytes32 resourceId,
        string calldata resource
    ) internal {
        _setResource(
            _directoryStorage().networkData[chainId],
            resourceId,
            resource
        );
    }

    function _deleteResource(uint256 chainId, bytes32 resourceId) internal {
        ChainIdData storage chainIdData = _directoryStorage().networkData[
            chainId
        ];
        delete chainIdData.resources[resourceId];
        chainIdData.resourceIds.remove(resourceId);
    }

    // -------- Internal queries --------
    function _getNetwork(
        uint256 chainId
    ) internal view returns (NetworkData memory networkData) {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        return
            $.chainIds.contains(chainId)
                ? _buildNetworkData($.networkData[chainId], chainId)
                : networkData;
    }

    function _getAllNetworks()
        internal
        view
        returns (NetworkData[] memory networks_)
    {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        uint256 networksLength = $.chainIds.length();
        networks_ = networksLength > 0
            ? _buildNetworksArray($, networksLength)
            : networks_;
    }

    function _getNetworksByAlgorithm(
        Algorithm algorithm
    ) internal view returns (NetworkData[] memory networks_) {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        uint256 algorithmLength = $.networksByAlgorithm[algorithm];
        if (algorithmLength == 0) return networks_;
        networks_ = new NetworkData[](algorithmLength);
        uint256 length = $.chainIds.length();
        uint256 networksIndex;

        for (
            uint256 index;
            index < length && networksIndex < algorithmLength;

        ) {
            uint256 chainId = $.chainIds.at(index);
            unchecked {
                ++index;
            }
            ChainIdData storage chainIdData = $.networkData[chainId];
            if (chainIdData.network.algorithm != algorithm) continue;
            networks_[networksIndex] = _buildNetworkData(chainIdData, chainId);
            unchecked {
                ++networksIndex;
            }
        }
    }

    function _getResourceKeys(
        uint256 chainId
    ) internal view returns (bytes32[] memory) {
        return _directoryStorage().networkData[chainId].resourceIds.values();
    }

    function _getNetworksPaginated(
        uint256 pageSize,
        uint256 pageIndex
    )
        internal
        view
        returns (
            NetworkData[] memory networks,
            uint256 totalCount,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        EnumerableSet.UintSet storage set = _directoryStorage().chainIds;
        totalCount = set.length();
        uint256 cursor;
        (cursor, howMany, prev, next) = LibCommon.getPaginationParameters(
            set.length(),
            pageIndex,
            pageSize
        );

        if (howMany == 0) return (networks, totalCount, howMany, prev, next);

        networks = new NetworkData[](howMany);
        for (uint256 i; i < howMany; ) {
            networks[i] = _getNetwork(set.at(cursor));
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /**
     * @notice Internal function to get total count of networks
     * @dev Efficient way to get count without loading all network data
     * @return count Total number of networks in the directory
     */
    function _getNetworksCount() internal view returns (uint256 count) {
        return _directoryStorage().chainIds.length();
    }

    function _getResourceKeysPaginated(
        uint256 chainId,
        uint256 pageSize,
        uint256 pageIndex
    )
        internal
        view
        returns (
            bytes32[] memory resourceIds,
            uint256 totalCount,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        NetworkDirectoryStorage storage $ = _directoryStorage();
        EnumerableSet.Bytes32Set storage set = $
            .networkData[chainId]
            .resourceIds;
        totalCount = set.length();
        uint256 cursor;
        (cursor, howMany, prev, next) = LibCommon.getPaginationParameters(
            set.length(),
            pageIndex,
            pageSize
        );

        if (howMany == 0) return (resourceIds, totalCount, howMany, prev, next);

        resourceIds = new bytes32[](howMany);
        for (uint256 i; i < howMany; ) {
            resourceIds[i] = set.at(cursor);
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    /**
     * @notice Internal function to get total count of resources for a network
     * @dev Efficient way to get resource count without loading resource data
     * @param chainId The network identifier to count resources for
     * @return count Total number of resources for the network
     */
    function _getResourceCount(
        uint256 chainId
    ) internal view returns (uint256 count) {
        return _directoryStorage().networkData[chainId].resourceIds.length();
    }

    function _setResource(
        ChainIdData storage chainIdData,
        bytes32 resourceId,
        string calldata resource
    ) private {
        if (!chainIdData.resourceIds.contains(resourceId)) {
            chainIdData.resourceIds.add(resourceId);
        }
        chainIdData.resources[resourceId] = resource;
    }

    function _buildNetworkData(
        ChainIdData storage chainIdData,
        uint256 chainId
    ) private view returns (NetworkData memory networkData) {
        networkData = NetworkData({
            chainId: chainId,
            name: chainIdData.network.name,
            symbol: chainIdData.network.symbol,
            algorithm: chainIdData.network.algorithm,
            stage: chainIdData.network.stage,
            resources: _buildResourcesArray(chainIdData)
        });
    }

    function _buildResourcesArray(
        ChainIdData storage chainIdData
    ) private view returns (Resource[] memory resources_) {
        uint256 resourcesLength = chainIdData.resourceIds.length();
        if (resourcesLength == 0) return resources_;
        resources_ = new Resource[](resourcesLength);
        for (uint256 index; index < resourcesLength; ) {
            bytes32 resourceId = chainIdData.resourceIds.at(index);
            resources_[index] = Resource({
                resourceId: resourceId,
                resource: chainIdData.resources[resourceId]
            });
            unchecked {
                ++index;
            }
        }
    }

    function _buildNetworksArray(
        NetworkDirectoryStorage storage $,
        uint256 networksLength
    ) private view returns (NetworkData[] memory networks_) {
        networks_ = new NetworkData[](networksLength);
        for (uint256 index; index < networksLength; ) {
            uint256 chainId = $.chainIds.at(index);
            networks_[index] = _buildNetworkData(
                $.networkData[chainId],
                chainId
            );
            unchecked {
                ++index;
            }
        }
    }

    function _checkNetworkExists(uint256 chainId) private view {
        require(
            _directoryStorage().chainIds.contains(chainId),
            NetworkNotFound(chainId)
        );
    }

    function _checkNetworkDoesNotExist(uint256 chainId) private view {
        require(
            !_directoryStorage().chainIds.contains(chainId),
            NetworkAlreadyExists(chainId)
        );
    }

    function _checkResourceExists(
        uint256 chainId,
        bytes32 resourceId
    ) private view {
        _checkNetworkExists(chainId);
        require(
            _directoryStorage().networkData[chainId].resourceIds.contains(
                resourceId
            ),
            ResourceNotFound(chainId, resourceId)
        );
    }

    function _validateCreateNetworkData(
        NetworkData calldata network
    ) private pure {
        _checkUintIsNotZero(network.chainId);
        _checkBytes32IsNotZero(network.name);
        _checkValidAlgorithm(network.algorithm);
        _checkBytes32IsNotZero(network.symbol);
        _checkValidStage(network.stage);
        _checkResources(network.resources);
    }

    function _validateUpdateNetworkData(
        UpdateNetworkData calldata network
    ) private pure {
        _checkUintIsNotZero(network.chainId);
        _checkBytes32IsNotZero(network.name);
        _checkValidAlgorithm(network.algorithm);
        _checkBytes32IsNotZero(network.symbol);
        _checkValidStage(network.stage);
    }

    function _checkResources(Resource[] calldata resources) private pure {
        uint256 length = resources.length;
        for (uint256 index; index < length; ) {
            Resource calldata resource = resources[index];
            bytes32 resourceId = resource.resourceId;
            _checkBytes32IsNotZero(resources[index].resourceId);
            _checkEmptyString(resources[index].resource);
            unchecked {
                ++index;
            }
            _checkDuplicatedResources(resources, resourceId, index, length);
        }
    }

    function _checkDuplicatedResources(
        Resource[] calldata resources,
        bytes32 resourceId,
        uint256 current,
        uint256 length
    ) private pure {
        for (uint256 inner = current; inner < length; ) {
            bytes32 innerId = resources[inner].resourceId;
            require(
                resourceId != innerId,
                DuplicatedResource(resourceId, innerId)
            );
            unchecked {
                ++inner;
            }
        }
    }

    function _checkValidAlgorithm(Algorithm algorithm) private pure {
        require(algorithm != Algorithm.NONE, InvalidAlgorithm());
    }

    function _checkValidStage(Stage stage) private pure {
        require(stage != Stage.NONE, InvalidStage());
    }

    function _directoryStorage()
        private
        pure
        returns (NetworkDirectoryStorage storage $)
    {
        bytes32 storagePosition = _NETWORK_DIRECTORY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := storagePosition
        }
        // slither-disable-end assembly
    }
}
