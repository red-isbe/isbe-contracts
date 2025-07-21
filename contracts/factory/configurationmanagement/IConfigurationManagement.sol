// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDiamondLoupe} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';

/**
 * @title IConfigurationManagement
 * @notice Defines a standard for managing versioned business logic configurations.
 * @dev Provides an interface for configuration management within a Diamond proxy context,
 * allowing for the registration and retrieval of versioned sets of facets.
 * @author ISBE
 */
interface IConfigurationManagement {
    /**
     * @notice Represents a specific version of a piece of business logic.
     * @param businessId The unique identifier for the business logic.
     * @param version The version number of the business logic to be used.
     */
    struct BusinessData {
        bytes32 businessId;
        uint256 version;
    }

    /**
     * @notice Emitted when a new configuration version is successfully set.
     * @param configurationId The unique ID of the configuration being set.
     * @param businessData The array of business logic making up the configuration.
     * @param version The new version number assigned to this configuration.
     */
    event ConfigurationSet(
        bytes32 configurationId,
        BusinessData[] businessData,
        uint256 version
    );

    /**
     * @notice Thrown when a requested configuration ID and version combination is not found.
     * @param configurationId The ID of the configuration that was not found.
     * @param version The version number that was not found.
     */
    error InvalidConfiguration(bytes32 configurationId, uint256 version);

    /**
     * @notice Registers or updates a versioned configuration of business logic facets.
     * @param _configurationId The unique identifier for the configuration.
     * @param businessIds An array linking business logic IDs to specific versions.
     */
    function setConfiguration(
        bytes32 _configurationId,
        BusinessData[] calldata businessIds
    ) external;

    /**
     * @notice Retrieves a configuration by its identifier and version.
     * @param _configurationId The identifier of the configuration to retrieve.
     * @param _version The version number. Use 0 for the latest recognised version.
     * @return businessData_ The array of business logic data for the specified version.
     */
    function getConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view returns (BusinessData[] memory businessData_);

    /**
     * @notice Checks that a specific configuration and version exist. Reverts if not.
     * @param _configurationId The identifier of the configuration to validate.
     * @param _version The version number to validate. Use 0 for the latest version.
     */
    function checkConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view;

    /**
     * @notice Retrieves detailed facet information, including all function selectors.
     * @param _configurationId The identifier of the configuration to query.
     * @param _version The version number. Use 0 for the latest version.
     * @return facets_ An array of `IDiamondLoupe.Facet` structs for the configuration.
     */
    function facets(
        bytes32 _configurationId,
        uint256 _version
    ) external view returns (IDiamondLoupe.Facet[] memory facets_);

    /**
     * @notice Gets all function selectors for a specific facet within a configuration.
     * @param _configurationId The identifier of the configuration to query.
     * @param _version The version number. Use 0 for the latest version.
     * @param _facet The address of the facet to inspect.
     * @return facetFunctionSelectors_ An array of its `bytes4` function selectors.
     */
    function facetFunctionSelectors(
        bytes32 _configurationId,
        uint256 _version,
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_);

    /**
     * @notice Gets all unique facet addresses for a given configuration version.
     * @param _configurationId The identifier of the configuration to query.
     * @param _version The version number. Use 0 for the latest version.
     * @return facetAddresses_ An array of unique facet addresses.
     */
    function facetAddresses(
        bytes32 _configurationId,
        uint256 _version
    ) external view returns (address[] memory facetAddresses_);

    /**
     * @notice Finds which facet a function selector belongs to in a configuration.
     * @param _configurationId The identifier of the configuration to query.
     * @param _version The version number. Use 0 for the latest version.
     * @param _functionSelector The `bytes4` selector to find.
     * @return facetAddress_ The address of the corresponding facet.
     */
    function facetAddress(
        bytes32 _configurationId,
        uint256 _version,
        bytes4 _functionSelector
    ) external view returns (address facetAddress_);

    /**
     * @notice Checks if a configuration version supports a given EIP-165 interface.
     * @param _configurationId The identifier of the configuration to query.
     * @param _version The version number. Use 0 for the latest version.
     * @param _interfaceId The `bytes4` EIP-165 interface ID to check.
     * @return supported_ Returns true if the interface is supported, otherwise false.
     */
    function facetSupportsInterface(
        bytes32 _configurationId,
        uint256 _version,
        bytes4 _interfaceId
    ) external view returns (bool supported_);
}
