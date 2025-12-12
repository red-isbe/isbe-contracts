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

import {NetworkData, UpdateNetworkData, Algorithm} from './Types.sol';
import {INetworkDirectory} from './INetworkDirectory.sol';
import {NetworkDirectoryInternal} from './NetworkDirectoryInternal.sol';
import {_NETWORK_DIRECTORY_ROLE} from '../../constants/roles.sol';

/**
 * @title NetworkDirectory
 * @notice External layer providing access-controlled network directory operations
 * @dev This abstract contract implements the public interface for network directory management.
 *      It adds access control, pause functionality, and validation to the internal operations.
 *      All functions require the NETWORK_DIRECTORY_ROLE and respect the contract pause state.
 * @author ISBE Development Team
 */
abstract contract NetworkDirectory is
    INetworkDirectory,
    NetworkDirectoryInternal
{
    /**
     * @notice Creates a new network in the directory
     * @dev Validates network data, checks pause state, and requires NETWORK_DIRECTORY_ROLE
     * @param network The complete network information to create
     * @custom:security Requires NETWORK_DIRECTORY_ROLE permission
     * @custom:modifiers validateCreateNetworkData, whenNotPaused, onlyRole, onlyNonExistentNetwork
     * @custom:revert EmptyUint if chainId is 0
     * @custom:revert EmptyBytes32 if name or symbol is empty (ZeroHash)
     * @custom:revert InvalidStage if stage is NONE or invalid enum value
     * @custom:revert NetworkAlreadyExists if chainId already exists in directory
     * @custom:revert DuplicatedResource if resources array contains duplicate resourceIds
     * @custom:revert Paused if contract is paused
     * @custom:revert AccessControlUnauthorizedAccount if caller lacks NETWORK_DIRECTORY_ROLE
     * @custom:invariants
     *   - chainId must be non-zero and unique across all networks
     *   - name and symbol must be non-empty bytes32 values
     *   - algorithm must be valid EllipticType enum (SECP_256_K1 or SECP_256_R1)
     *   - stage must be valid enum value (DEV, PRE, or PROD) and cannot be NONE
     *   - resources array cannot contain duplicate resourceIds
     *   - network is added to directory and can be retrieved after creation
     * @custom:emit NetworkCreated with the complete network data
     */
    function createNetwork(
        NetworkData calldata network
    )
        external
        override
        validateCreateNetworkData(network)
        whenNotPaused
        onlyRole(_NETWORK_DIRECTORY_ROLE)
        onlyNonExistentNetwork(network.chainId)
    {
        _createNetwork(network);
        emit NetworkCreated(network);
    }

    /**
     * @notice Updates an existing network in the directory
     * @dev Validates network data, checks pause state, and requires NETWORK_DIRECTORY_ROLE
     * @param network The updated network information (resources are managed separately via setResource)
     * @custom:security Requires NETWORK_DIRECTORY_ROLE permission
     * @custom:modifiers validateUpdateNetworkData, whenNotPaused, onlyRole, onlyExistentNetwork
     * @custom:revert NetworkNotFound if network with specified chainId does not exist
     * @custom:revert EmptyBytes32 if name or symbol is empty (ZeroHash)
     * @custom:revert Paused if contract is paused
     * @custom:revert AccessControlUnauthorizedAccount if caller lacks NETWORK_DIRECTORY_ROLE
     * @custom:invariants
     *   - network must exist before update
     *   - chainId cannot be modified (identifies the network)
     *   - name and symbol must be non-empty bytes32 values
     *   - algorithm must be valid EllipticType enum
     *   - stage must be valid enum value
     *   - resources are not updated via this function (use setResource/deleteResource)
     *   - updated data replaces existing network information except resources
     * @custom:emit NetworkUpdated with the complete updated network data
     */
    function updateNetwork(
        UpdateNetworkData calldata network
    )
        external
        override
        validateUpdateNetworkData(network)
        whenNotPaused
        onlyRole(_NETWORK_DIRECTORY_ROLE)
        onlyExistentNetwork(network.chainId)
    {
        _updateNetwork(network);
        emit NetworkUpdated(network);
    }

    /**
     * @notice Deletes a network and all its resources from the directory
     * @dev Ensures network exists, checks pause state and permissions before deletion
     * @param chainId The unique identifier of the network to delete
     * @custom:security Requires NETWORK_DIRECTORY_ROLE permission
     * @custom:modifiers emptyUint, whenNotPaused, onlyRole, onlyExistentNetwork
     * @custom:revert EmptyUint if chainId is 0
     * @custom:revert NetworkNotFound if network with specified chainId does not exist
     * @custom:revert Paused if contract is paused
     * @custom:revert AccessControlUnauthorizedAccount if caller lacks NETWORK_DIRECTORY_ROLE
     * @custom:warning This operation is irreversible and removes all network resources via cascade deletion
     * @custom:invariants
     *   - chainId must be non-zero
     *   - network must exist before deletion
     *   - network must not exist after deletion
     *   - all associated resources are automatically deleted (cascade)
     *   - network count is decremented
     *   - chainId is removed from the directory's chainId array
     * @custom:emit NetworkDeleted with the deleted chainId
     */
    function deleteNetwork(
        uint256 chainId
    )
        external
        override
        emptyUint(chainId)
        whenNotPaused
        onlyRole(_NETWORK_DIRECTORY_ROLE)
        onlyExistentNetwork(chainId)
    {
        _deleteNetwork(chainId);
        emit NetworkDeleted(chainId);
    }

    /**
     * @notice Sets or updates a resource for a specific network
     * @dev Creates new resource or updates existing one, with access control and pause checks
     * @param chainId The network identifier to set the resource for
     * @param resourceId The unique identifier for the resource type (e.g., "RPC", "EXPLORER")
     * @param resource The resource content (typically a URL or endpoint string)
     * @custom:security Requires NETWORK_DIRECTORY_ROLE permission
     * @custom:modifiers emptyUint, bytes32IsNotZero, emptyString, whenNotPaused, onlyRole, onlyExistentNetwork
     * @custom:revert EmptyUint if chainId is 0
     * @custom:revert EmptyBytes32 if resourceId is ZeroHash
     * @custom:revert EmptyString if resource content is empty string
     * @custom:revert NetworkNotFound if network with specified chainId does not exist
     * @custom:revert Paused if contract is paused
     * @custom:revert AccessControlUnauthorizedAccount if caller lacks NETWORK_DIRECTORY_ROLE
     * @custom:invariants
     *   - chainId must be non-zero
     *   - network must exist
     *   - resourceId must be non-empty bytes32 value
     *   - resource content must be non-empty string
     *   - creates new resource if resourceId doesn't exist for the network
     *   - updates existing resource if resourceId already exists for the network
     *   - resource count is incremented only for new resources
     * @custom:emit ResourceSet with chainId, resourceId, and resource content
     */
    function setResource(
        uint256 chainId,
        bytes32 resourceId,
        string calldata resource
    )
        external
        override
        emptyUint(chainId)
        bytes32IsNotZero(resourceId)
        emptyString(resource)
        whenNotPaused
        onlyRole(_NETWORK_DIRECTORY_ROLE)
        onlyExistentNetwork(chainId)
    {
        _setResource(chainId, resourceId, resource);
        emit ResourceSet(chainId, resourceId, resource);
    }

    /**
     * @notice Deletes a specific resource from a network
     * @dev Removes the resource with access control and pause checks
     * @param chainId The network identifier to delete the resource from
     * @param resourceId The unique identifier of the resource to delete
     * @custom:security Requires NETWORK_DIRECTORY_ROLE permission
     * @custom:modifiers emptyUint, bytes32IsNotZero, whenNotPaused, onlyRole, onlyExistentResource
     * @custom:revert EmptyUint if chainId is 0
     * @custom:revert EmptyBytes32 if resourceId is ZeroHash
     * @custom:revert NetworkNotFound if network with specified chainId does not exist
     * @custom:revert ResourceNotFound if resource with specified resourceId does not exist for the network
     * @custom:revert Paused if contract is paused
     * @custom:revert AccessControlUnauthorizedAccount if caller lacks NETWORK_DIRECTORY_ROLE
     * @custom:invariants
     *   - chainId must be non-zero
     *   - network must exist
     *   - resourceId must be non-empty bytes32 value
     *   - resource must exist before deletion
     *   - resource must not exist after deletion
     *   - resource count is decremented
     *   - remaining resources maintain correct ordering
     * @custom:emit ResourceDeleted with chainId and resourceId
     */
    function deleteResource(
        uint256 chainId,
        bytes32 resourceId
    )
        external
        override
        emptyUint(chainId)
        bytes32IsNotZero(resourceId)
        whenNotPaused
        onlyRole(_NETWORK_DIRECTORY_ROLE)
        onlyExistentResource(chainId, resourceId)
    {
        _deleteResource(chainId, resourceId);
        emit ResourceDeleted(chainId, resourceId);
    }

    /**
     * @notice Retrieves complete information for a specific network
     * @dev Returns network data including all associated resources. Returns empty/zero values if network doesn't exist.
     * @param chainId The unique identifier of the network to retrieve
     * @return network Complete network information including resources array. Returns default empty NetworkData
     *         if network not found.
     * @custom:behaviour Non-existent networks return zero-initialized NetworkData struct without reverting
     */
    function getNetwork(
        uint256 chainId
    ) external view override returns (NetworkData memory network) {
        return _getNetwork(chainId);
    }

    /**
     * @notice Retrieves all networks registered in the directory
     * @dev Returns complete network information including resources for all networks. Returns empty array
     *      if no networks exist.
     * @return networks Array of all registered networks with their complete resource arrays
     * @custom:gas May consume significant gas for large directories (20+ networks)
     * @custom:warning For large directories, consider using getNetworksPaginated() instead for better gas efficiency
     * @custom:behaviour Returns empty array when directory contains no networks
     */
    function getAllNetworks()
        external
        view
        override
        returns (NetworkData[] memory networks)
    {
        return _getAllNetworks();
    }

    /**
     * @notice Retrieves all networks using a specific cryptographic algorithm
     * @dev Filters networks by algorithm field and returns complete information including resources
     * @param algorithm The cryptographic algorithm to filter by (EllipticType enum: SECP_256_K1 or SECP_256_R1)
     * @return networks Array of networks using the specified algorithm. Returns empty array if no matches found.
     * @custom:behaviour Returns empty array when no networks match the specified algorithm
     */
    function getNetworksByAlgorithm(
        Algorithm algorithm
    ) external view override returns (NetworkData[] memory networks) {
        return _getNetworksByAlgorithm(algorithm);
    }

    /**
     * @notice Retrieves paginated networks from the directory
     * @dev Returns a subset of networks with pagination metadata. Handles edge cases gracefully.
     * @param pageSize Maximum number of networks per page
     * @param pageIndex Index of the page to retrieve (1-based indexing)
     * @return networks Array of networks for the requested page (may be empty if offset exceeds count)
     * @return totalCount Total number of networks in the directory
     * @return howMany Actual number of networks returned in the current page (0 if offset exceeds total)
     * @return prev Previous page index (clamped to first page, minimum 1)
     * @return next Next page index (clamped to last available page)
     * @custom:behaviour When pageIndex exceeds available pages, returns empty array with metadata
     * @custom:gas More gas-efficient than getAllNetworks() for large directories
     */
    function getNetworksPaginated(
        uint256 pageSize,
        uint256 pageIndex
    )
        external
        view
        override
        returns (
            NetworkData[] memory networks,
            uint256 totalCount,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        return _getNetworksPaginated(pageSize, pageIndex);
    }

    /**
     * @notice Gets the total count of networks in the directory
     * @dev Efficient way to determine pagination parameters without loading data. Returns 0 if directory is empty.
     * @return count Total number of networks registered in the directory (0 if empty)
     * @custom:gas Very low gas consumption compared to getAllNetworks()
     * @custom:usage Useful for calculating pagination parameters before calling getNetworksPaginated()
     */
    function getNetworksCount() external view override returns (uint256 count) {
        return _getNetworksCount();
    }

    /**
     * @notice Lists all resource identifiers for a specific network
     * @dev Returns array of resourceIds that have been set for the network. Returns empty array for non-existent
     *      networks or networks without resources.
     * @param chainId The network identifier to list resources for
     * @return resourceIds Array of resource identifiers (bytes32) for the network. Empty array
     *         if network doesn't exist or has no resources.
     * @custom:warning For networks with many resources (30+), consider using getResourceKeysPaginated() instead
     * @custom:behaviour Does not revert for non-existent networks, returns empty array instead
     */
    function getResourceKeys(
        uint256 chainId
    ) external view override returns (bytes32[] memory resourceIds) {
        return _getResourceKeys(chainId);
    }

    /**
     * @notice Retrieves paginated resource identifiers for a specific network
     * @dev Returns a subset of resource keys with pagination metadata. Handles edge cases gracefully.
     * @param chainId The network identifier to list resources for
     * @param pageSize Maximum number of resource keys per page
     * @param pageIndex Index of the page to retrieve (1-based indexing)
     * @return resourceIds Array of resource identifiers (bytes32) for the requested page
     *         (empty if offset exceeds count or network not configured)
     * @return totalCount Total number of resources for the network (0 if network doesn't exist or has no resources)
     * @return howMany Actual number of resources returned in the current page (0 if offset exceeds total)
     * @return prev Previous page index (clamped to first page, minimum 1)
     * @return next Next page index (clamped to last available page)
     * @custom:behaviour Returns empty array with zero counts for non-existent networks without reverting
     * @custom:gas More gas-efficient than getResourceKeys() for networks with many resources
     */
    function getResourceKeysPaginated(
        uint256 chainId,
        uint256 pageSize,
        uint256 pageIndex
    )
        external
        view
        override
        returns (
            bytes32[] memory resourceIds,
            uint256 totalCount,
            uint256 howMany,
            uint256 prev,
            uint256 next
        )
    {
        return _getResourceKeysPaginated(chainId, pageSize, pageIndex);
    }

    /**
     * @notice Gets the total count of resources for a specific network
     * @dev Efficient way to determine resource pagination parameters without loading data.
     *      npReturns 0 for non-existent networks or networks without resources.
     * @param chainId The network identifier to count resources for
     * @return count Total number of resources for the network (0 if network doesn't exist or has no resources)
     * @custom:gas Very low gas consumption compared to getResourceKeys()
     * @custom:usage Useful for calculating pagination parameters before calling getResourceKeysPaginated()
     * @custom:behaviour Does not revert for non-existent networks, returns 0 instead
     */
    function getResourceCount(
        uint256 chainId
    ) external view override returns (uint256 count) {
        return _getResourceCount(chainId);
    }
}
