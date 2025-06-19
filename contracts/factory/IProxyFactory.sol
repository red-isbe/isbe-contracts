// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IProxyFactory
 * @notice Interface for deploying transparent and diamond proxies with unique configurations.
 * @dev Contains functions for both single and bulk deployment of proxies using given configurations and IDs.
 */
interface IProxyFactory {
    /**
     * @notice Emitted when a transparent proxy is successfully deployed.
     * @param businessId Unique identifier of the deployed business logic.
     * @param proxy Address of the deployed transparent proxy.
     */
    event TransparentDeployed(bytes32 businessId, address proxy);

    /**
     * @notice Emitted when multiple transparent proxies are successfully deployed in a batch.
     * @param businessIds Array of unique business logic IDs for deployed proxies.
     * @param proxies Array of addresses of the deployed transparent proxies.
     */
    event TransparentBulkDeployed(bytes32[] businessIds, address[] proxies);

    /**
     * @notice Emitted when a diamond proxy is deployed with its configuration and business logic.
     * @param configurationId Unique identifier of the deployed diamond configuration.
     * @param businessIds Array of unique business logic IDs linked to the diamond proxy.
     * @param version Version of the diamond configuration.
     * @param proxy Deployed diamond proxy’s address.
     */
    event DiamondDeployed(
        bytes32 configurationId,
        bytes32[] businessIds,
        uint256 version,
        address proxy
    );

    /**
     * @notice Deploys a single transparent proxy with its business ID and initialization data.
     * @dev The function emits the `TransparentDeployed` event on successful deployment.
     * @param businessId Unique ID of the business logic to link with the transparent proxy.
     * @param initData Initialization data for the proxy deployment.
     */
    function deployTransparent(
        bytes32 businessId,
        bytes calldata initData
    ) external;

    /**
     * @notice Deploys a diamond proxy linked to multiple business logic IDs and a root initializer.
     * @dev Emits `DiamondDeployed` upon success. Initialization data is used to initialize the contract.
     * @param configurationId Unique ID of the diamond configuration.
     * @param businessIds Array of business logic IDs for diamond facets.
     * @param initBusinessId The root initializer's business logic ID.
     * @param initData Initialization data for the deployment.
     */
    function deployDiamond(
        bytes32 configurationId,
        bytes32[] calldata businessIds,
        bytes32 initBusinessId,
        bytes calldata initData
    ) external;

    /**
     * @notice Deploys a diamond proxy with configuration ID and initialization details.
     * @dev Emits the `DiamondDeployed` event upon successful deployment.
     * @param configurationId Unique ID of the diamond configuration.
     * @param initBusinessId The root initializer's business logic ID.
     * @param initData Initialization data for the diamond deployment.
     */
    function deployDiamondByConfiguration(
        bytes32 configurationId,
        bytes32 initBusinessId,
        bytes calldata initData
    ) external;
}
