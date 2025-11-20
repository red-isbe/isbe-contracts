// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {NetworkData, UpdateNetworkData, Algorithm} from './Types.sol';

/**
 * @title INetworkDirectory
 * @notice Interface for managing a decentralised catalog of blockchain networks and their resources
 * @dev This interface provides CRUD operations for networks and their associated resources.
 *      Networks are identified by chainId and can have multiple resources (RPC endpoints, explorers, etc.)
 * @author Network Directory Development Team
 */
interface INetworkDirectory {
    /**
     * @notice Emitted when a new network is successfully created
     * @param network The complete network data including resources
     */
    event NetworkCreated(NetworkData network);

    /**
     * @notice Emitted when an existing network is updated
     * @param network The updated network data
     */
    event NetworkUpdated(UpdateNetworkData network);

    /**
     * @notice Emitted when a network is deleted from the catalog
     * @param chainId The unique identifier of the deleted network
     */
    event NetworkDeleted(uint256 chainId);

    /**
     * @notice Emitted when a resource is set or updated for a network
     * @param chainId The network identifier
     * @param resourceId The resource type identifier
     * @param resource The resource content that was set
     */
    event ResourceSet(uint256 chainId, bytes32 resourceId, string resource);

    /**
     * @notice Emitted when a resource is deleted from a network
     * @param chainId The network identifier
     * @param resourceId The resource type identifier that was deleted
     */
    event ResourceDeleted(uint256 chainId, bytes32 resourceId);

    /**
     * @notice Creates a new network in the catalog
     * @dev The network chainId must be unique and greater than 0
     * @param network The network data to create
     * @custom:security Only authorised roles can call this function
     * @custom:emits NetworkCreated
     */
    function createNetwork(NetworkData calldata network) external;

    /**
     * @notice Updates an existing network's information
     * @dev The chainId in the path must match the chainId in the network data
     * @param network The updated network data
     * @custom:security Only authorised roles can call this function
     * @custom:emits NetworkUpdated
     */
    function updateNetwork(UpdateNetworkData calldata network) external;

    /**
     * @notice Deletes a network and all its associated resources from the catalog
     * @dev This operation is irreversible and will remove all network resources
     * @param chainId The unique identifier of the network to delete
     * @custom:security Only authorised roles can call this function
     * @custom:emits NetworkDeleted
     */
    function deleteNetwork(uint256 chainId) external;

    /**
     * @notice Sets or updates a resource for a specific network
     * @dev If the resourceId doesn't exist, it will be created. If it exists, it will be updated
     * @param chainId The network identifier where the resource will be set
     * @param resourceId The unique identifier for the resource type (e.g., "RPC", "EXPLORER")
     * @param resource The resource content (typically a URL or endpoint)
     * @custom:security Only authorised roles can call this function
     * @custom:emits ResourceSet
     * @custom:throws "Network does not exist" if chainId is invalid
     * @custom:throws "ResourceId cannot be empty" if resourceId is zero
     */
    function setResource(
        uint256 chainId,
        bytes32 resourceId,
        string calldata resource
    ) external;

    /**
     * @notice Deletes a specific resource from a network
     * @dev Removes the resource completely from the network
     * @param chainId The network identifier from which to delete the resource
     * @param resourceId The unique identifier of the resource to delete
     * @custom:security Only authorised roles can call this function
     * @custom:emits ResourceDeleted
     * @custom:throws "Network does not exist" if chainId is invalid
     * @custom:throws "Resource does not exist" if resourceId is not found
     */
    function deleteResource(uint256 chainId, bytes32 resourceId) external;

    /**
     * @notice Retrieves a specific network by its chainId
     * @dev Returns the complete network information including all resources
     * @param chainId The unique identifier of the network to retrieve
     * @return network The complete network data including resources
     * @custom:throws "Network not found" if chainId doesn't exist
     */
    function getNetwork(
        uint256 chainId
    ) external view returns (NetworkData memory network);

    /**
     * @notice Retrieves all networks in the catalog
     * @dev Returns an array of all registered networks with their resources
     * @return networks Array containing all networks in the catalog
     * @custom:gas This function may consume significant gas for large catalogs
     */
    function getAllNetworks()
        external
        view
        returns (NetworkData[] memory networks);

    /**
     * @notice Retrieves all networks that use a specific cryptographic algorithm
     * @dev Filters networks by algorithm field and returns matches with resources
     * @param algorithm The cryptographic algorithm to filter by (e.g., "secp256r1")
     * @return networks Array of networks using the specified algorithm
     */
    function getNetworksByAlgorithm(
        Algorithm algorithm
    ) external view returns (NetworkData[] memory networks);

    /**
     * @notice Retrieves paginated networks from the catalog
     * @dev Returns a subset of networks with pagination details
     * @param pageSize Number of networks per page
     * @param pageIndex Index of the page to retrieve
     * @return networks Array of networks for the requested page
     * @return totalCount Total number of networks in the catalog
     * @return howMany Number of items returned in the current page
     * @return prev Previous page index (clamped to first page)
     * @return next Next page index (clamped to last page)
     */
    function getNetworksPaginated(
        uint256 pageSize,
        uint256 pageIndex
    )
        external
        view
        returns (
            NetworkData[] memory networks,
            uint256 totalCount,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Gets the total count of networks in the catalog
     * @dev Efficient way to get total count without fetching all data
     * @return count Total number of networks registered
     */
    function getNetworksCount() external view returns (uint256 count);

    /**
     * @notice Lists all resource identifiers available for a specific network
     * @dev Returns an array of all resourceIds that have been set for the network
     * @param chainId The network identifier to list resources for
     * @return resourceIds Array of resource identifiers available for the network
     * @custom:throws "Network does not exist" if chainId is invalid
     * @custom:warning For networks with many resources, consider using listResourceKeysPaginated()
     * @custom:deprecated Consider using listResourceKeysPaginated() for better gas efficiency
     */
    function getResourceKeys(
        uint256 chainId
    ) external view returns (bytes32[] memory resourceIds);

    /**
     * @notice Retrieves paginated resource identifiers for a specific network
     * @dev Returns a subset of resource identifiers with pagination details
     * @param chainId The network identifier to list resources for
     * @param pageSize Number of resource identifiers per page
     * @param pageIndex Index of the page to retrieve
     * @return resourceIds Array of resource identifiers for the requested page
     * @return totalCount Total number of resources for the network
     * @return howMany Number of items returned in the current page
     * @return prev Previous page index (clamped to first page)
     * @return next Next page index (clamped to last page)
     */
    function getResourceKeysPaginated(
        uint256 chainId,
        uint256 pageSize,
        uint256 pageIndex
    )
        external
        view
        returns (
            bytes32[] memory resourceIds,
            uint256 totalCount,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    /**
     * @notice Gets the total count of resources for a specific network
     * @dev Efficient way to get resource count without loading resource data
     * @param chainId The network identifier to count resources for
     * @return count Total number of resources for the network
     * @custom:throws "Network does not exist" if chainId is invalid
     */
    function getResourceCount(
        uint256 chainId
    ) external view returns (uint256 count);
}
