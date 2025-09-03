// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';

/**
 * @title Proxy Factory Interface
 * @author ISBE
 * @notice Interface for deploying and managing diamond proxy contracts
 * @dev Provides functionality to deploy use-case proxies with business logic
 *      facets and manage their configurations through diamond patterns
 */
interface IProxyFactory {
    /**
     * @notice Emitted when a new use-case proxy is successfully deployed
     * @param configurationId The unique identifier for the configuration
     * @param version The version number of the configuration used
     * @param rbacs Array of role-based access control configurations
     * @param proxy The address of the deployed proxy contract
     */
    event UseCaseDeployed(
        bytes32 configurationId,
        uint256 version,
        IAccessControl.Rbac[] rbacs,
        address proxy
    );

    /**
     * @notice Reverted when attempting to deploy a diamond proxy with an
     *         empty list of business IDs
     */
    error NotEmptyBusinessIds();

    /**
     * @notice Reverted when a caller attempts an action with a role that is
     *         not permitted
     * @param role The specific role that was found to be unauthorised
     */
    error ForbiddenRole(bytes32 role);

    /**
     * @notice Reverted if a requested facet is not on the list of permitted
     *         facets for deployment
     * @param businessId The identifier of the facet that is not permitted
     */
    error FacetNotPermitted(bytes32 businessId);

    /**
     * @notice Reverted if the list of business logic identifiers contains
     *         a duplicate entry
     * @param businessId The identifier that was duplicated in the list
     */
    error DuplicatedBusinessId(bytes32 businessId);

    /**
     * @notice Reverted if a specified business logic identifier has not been
     *         registered with the factory
     * @param businessId The unregistered identifier
     */
    error CurrentIdNotRegistered(bytes32 businessId);

    /**
     * @notice Reverted during diamond deployment if the specified
     *         initialisation facet is not in the list of facets being deployed
     * @param businessId The identifier of the initialisation facet that was
     *                   not found
     */
    error FacetNotFound(bytes32 businessId);

    /**
     * @notice Deploys a new use-case proxy with the specified configuration
     * @dev Creates a diamond proxy with business logic facets and access
     *      control, then initialises it with the provided data
     * @param _configurationId The unique identifier for the configuration
     * @param _version The version number of the configuration (0 for latest)
     * @param _rbacs Array of role-based access control configurations
     * @param _initPause use case is initialized paused or not
     * @param _initBusinessIds The business IDs of the facets to use for init
     * @param _initData The calldata for the initialisation function
     */
    function deployUseCase(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControl.Rbac[] calldata _rbacs,
        bool _initPause,
        bytes32[] calldata _initBusinessIds,
        bytes[] calldata _initData
    ) external;

    /**
     * @notice Identical to deployUseCase but deploys to a specific address (CREATE2)
     * @dev Creates a diamond proxy with business logic facets and access
     *      control, then initialises it with the provided data
     * @param _configurationId The unique identifier for the configuration
     * @param _version The version number of the configuration (0 for latest)
     * @param _rbacs Array of role-based access control configurations
     * @param _initPause use case is initialized paused or not
     * @param _initBusinessIds The business IDs of the facets to use for init
     * @param _initData The calldata for the initialisation function
     * @param _salt The salt used to determine the deployed address with CREATE2
     */
    function deployUseCaseTo(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControl.Rbac[] calldata _rbacs,
        bool _initPause,
        bytes32[] calldata _initBusinessIds,
        bytes[] calldata _initData,
        bytes32 _salt
    ) external;

    /**
     * @notice Retrieves all deployed proxies for a specific configuration
     * @dev Returns an array of proxy addresses that were deployed with the
     *      given configuration and version
     * @param _configurationId The unique identifier for the configuration
     * @param _version The version number of the configuration
     * @return proxies_ Array of deployed proxy addresses
     */
    function getDeployedProxiesByConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view returns (address[] memory proxies_);

    /**
     * @notice Gets the configuration details for a specific proxy
     * @dev Returns the configuration ID and version used to deploy the proxy
     * @param _proxy The address of the deployed proxy contract
     * @return configurationId_ The unique identifier for the configuration
     * @return version_ The version number of the configuration
     */
    function getConfigurationByProxy(
        address _proxy
    ) external view returns (bytes32 configurationId_, uint256 version_);
}
