// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Client Filtering Interface
 * @notice Defines the structure and behaviour for managing blockchain transaction and
 * contract interaction filters in a decentralised client environment
 * @dev This interface enables granular filtering of blockchain activity through multiple
 * filter types including transaction hashes, contract addresses, function signatures,
 * and JSON-RPC methods. Filters are organised by block ranges for temporal filtering
 * @author ISBE Development Team
 */
interface IClientFiltering {
    /**
     * @notice Enumeration of available filter types for client-side filtering operations
     * @param NONE No filtering applied - allows all transactions
     * @param TRANSACTION_HASH Filter by specific transaction hash
     * @param CONTRACT Filter by contract address only
     * @param SIGNATURE Filter by function signature only
     * @param CONTRACT_AND_SIGNATURE Filter by both contract address and function signature
     * @param JSONRPC_METHOD Filter by JSON-RPC method name
     */
    enum FilterType {
        NONE,
        TRANSACTION_HASH,
        CONTRACT,
        SIGNATURE,
        CONTRACT_AND_SIGNATURE,
        JSONRPC_METHOD
    }

    /**
     * @notice Structure representing a comprehensive filter configuration for blockchain
     * transaction monitoring and client-side filtering
     * @param filterId Unique identifier for the filter instance
     * @param filterType Type of filtering to be applied from FilterType enumeration
     * @param transactionHash Specific transaction hash to filter (used with
     * TRANSACTION_HASH type)
     * @param contractAddress Target contract address for filtering (used with CONTRACT
     * and CONTRACT_AND_SIGNATURE types)
     * @param signature Function signature bytes4 selector for filtering (used with
     * SIGNATURE and CONTRACT_AND_SIGNATURE types)
     * @param jsonRpcMethod JSON-RPC method name for filtering (used with JSONRPC_METHOD
     * type)
     * @param initialBlock Starting block number for the filter's temporal range
     * @param endBlock Ending block number for the filter's temporal range
     */
    struct Filter {
        bytes32 filterId;
        IClientFiltering.FilterType filterType;
        bytes32 transactionHash;
        address contractAddress;
        bytes4 signature;
        bytes32 jsonRpcMethod;
        uint256 initialBlock;
        uint256 endBlock;
    }

    /**
     * @notice Emitted when a new filter is successfully registered in the system
     * @param filterId Unique identifier of the registered filter
     * @param filterType Type of filtering applied from FilterType enumeration
     * @param transactionHash Transaction hash criteria (if applicable to filter type)
     * @param contractAddress Contract address criteria (if applicable to filter type)
     * @param signature Function signature criteria (if applicable to filter type)
     * @param jsonRpcMethod JSON-RPC method criteria (if applicable to filter type)
     * @param initialBlock Starting block number for the filter's active range
     * @param endBlock Ending block number for the filter's active range
     */
    event FilterRegistered(
        bytes32 filterId,
        IClientFiltering.FilterType filterType,
        bytes32 transactionHash,
        address contractAddress,
        bytes4 signature,
        bytes32 jsonRpcMethod,
        uint256 initialBlock,
        uint256 endBlock
    );

    /**
     * @notice Thrown when attempting to register a filter with invalid parameters or
     * configuration that does not match the specified filter type requirements
     * @dev This error ensures filter integrity by validating that required fields
     * are populated based on the selected FilterType
     * @param filterId The filter identifier that failed validation
     * @param filterType The attempted filter type
     * @param transactionHash Transaction hash parameter provided
     * @param contractAddress Contract address parameter provided
     * @param signature Function signature parameter provided
     * @param jsonRpcMethod JSON-RPC method parameter provided
     * @param initialBlock Initial block parameter provided
     * @param endBlock End block parameter provided
     */
    error InvalidFilter(
        bytes32 filterId,
        IClientFiltering.FilterType filterType,
        bytes32 transactionHash,
        address contractAddress,
        bytes4 signature,
        bytes32 jsonRpcMethod,
        uint256 initialBlock,
        uint256 endBlock
    );

    /**
     * @notice Thrown when attempting to register a filter with an identifier that
     * already exists in the system
     * @dev Ensures filter uniqueness and prevents accidental overwrites of existing
     * filter configurations
     * @param filterId The duplicate filter identifier that caused the collision
     */
    error FilterIdExists(bytes32 filterId);

    /**
     * @notice Registers a new filter configuration for client-side blockchain
     * transaction filtering
     * @dev Validates filter parameters against the specified FilterType and ensures
     * the filterId is unique before registration. Emits FilterRegistered event
     * upon successful registration
     * @param _filter Complete filter configuration structure containing all necessary
     * parameters for the specified filter type
     */
    function registerFilter(Filter calldata _filter) external;

    /**
     * @notice Retrieves the total number of filters currently registered in the system
     * @dev Useful for pagination calculations and determining the total filter count
     * for administrative purposes
     * @return Total count of registered filters
     */
    function getFiltersLength() external view returns (uint256);

    /**
     * @notice Retrieves a paginated subset of registered filters for efficient
     * data access and client-side rendering
     * @dev Implements pagination to manage memory usage when dealing with large
     * numbers of registered filters. Page numbers are zero-indexed
     * @param _pageNumber Zero-indexed page number for pagination (starts from 0)
     * @param _pageSize Maximum number of filters to return per page
     * @return filters_ Array of Filter structures representing the requested page
     */
    function getFiltersByPage(
        uint256 _pageNumber,
        uint256 _pageSize
    ) external view returns (Filter[] memory filters_);

    /**
     * @notice Checks whether a filter with the specified identifier exists in the
     * system
     * @dev Provides a gas-efficient way to verify filter existence before
     * performing operations that require the filter to exist
     * @param _filterId Unique identifier of the filter to check
     * @return Boolean indicating whether the filter exists (true) or not (false)
     */
    function isFilterRegistered(bytes32 _filterId) external view returns (bool);
}
