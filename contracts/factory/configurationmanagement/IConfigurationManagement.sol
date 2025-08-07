// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    IDiamondLoupe
} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';

interface IConfigurationManagement {
    /**
     * @notice Holds the data for a piece of business logic.
     * @param businessId The unique identifier for the business logic.
     * @param version The version of the business logic to be used.
     */
    struct BusinessData {
        bytes32 businessId;
        uint256 version;
    }

    event ConfigurationSet(
        bytes32 configurationId,
        BusinessData[] businessData,
        uint256 version
    );

    function setConfiguration(
        bytes32 configurationId,
        BusinessData[] calldata businessIds
    ) external;

    function getConfiguration(
        bytes32 configurationId,
        uint256 version
    ) external view returns (BusinessData[] memory businessData);

    /**
     * @notice Retrieves detailed facet information, including selectors.
     * @param configurationId The identifier of the configuration to query.
     * @param version The version number. Use 0 to get the latest version.
     * @return facets An array of `IDiamondLoupe.Facet` structs.
     */
    function facets(
        bytes32 configurationId,
        uint256 version
    ) external view returns (IDiamondLoupe.Facet[] memory facets);

    /**
     * @notice Gets all function selectors for a specific facet in a configuration.
     * @param configurationId The identifier of the configuration to query.
     * @param version The version number. Use 0 to get the latest version.
     * @param facet The address of the facet.
     * @return facetFunctionSelectors_ An array of `bytes4` function selectors.
     */
    function facetFunctionSelectors(
        bytes32 configurationId,
        uint256 version,
        address facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_);

    /**
     * @notice Gets all unique facet addresses for a given configuration.
     * @param configurationId The identifier of the configuration to query.
     * @param version The version number. Use 0 to get the latest version.
     * @return facetAddresses_ An array of unique facet addresses.
     */
    function facetAddresses(
        bytes32 configurationId,
        uint256 version
    ) external view returns (address[] memory facetAddresses_);

    /**
     * @notice Finds which facet a specific function selector belongs to.
     * @param configurationId The identifier of the configuration to query.
     * @param version The version number. Use 0 to get the latest version.
     * @param functionSelector The `bytes4` selector to find.
     * @return facetAddress_ The address of the corresponding facet.
     */
    function facetAddress(
        bytes32 configurationId,
        uint256 version,
        bytes4 functionSelector
    ) external view returns (address facetAddress_);

    /**
     * @notice Checks if a configuration version supports a given EIP-165 interface.
     * @param configurationId The identifier of the configuration to query.
     * @param version The version number. Use 0 to get the latest version.
     * @param interfaceId The `bytes4` EIP-165 interface ID.
     * @return supported_ Returns true if the interface is supported.
     */
    function facetSupportsInterface(
        bytes32 configurationId,
        uint256 version,
        bytes4 interfaceId
    ) external view returns (bool supported_);
}
