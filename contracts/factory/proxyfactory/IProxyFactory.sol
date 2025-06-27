// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';

/// @title Interface for a Universal Proxy Contract Factory
/// @author ISBE
/// @notice Defines a standard factory for deploying different kinds of proxy contracts,
///         including Transparent and Diamond proxies.
/// @dev This interface specifies the functions, events, and errors that a proxy factory must
///      implement. It provides a consistent API for creating and initialising complex proxy
///      setups, ensuring that any implementing contract is predictable and interoperable.
interface IProxyFactory {
    /// @notice Emitted when a new diamond proxy has been successfully deployed and initialised.
    /// @param businessIds Identifiers for all the business logic facets attached to the diamond.
    /// @param rbacs The Role-Based Access Control (RBAC) settings applied during initialisation.
    /// @param proxy The address of the newly created diamond proxy contract.
    event DiamondDeployed(
        bytes32[] businessIds,
        IAccessControl.Rbac[] rbacs,
        address proxy
    );

    /// @notice Reverted when attempting to deploy a diamond proxy with an empty list of business IDs.
    error NotEmptyBusinessIds();

    /// @notice Reverted when a caller attempts an action with a role that is not permitted.
    /// @param role The specific role that was found to be unauthorised.
    error ForbiddenRole(bytes32 role);

    /// @notice Reverted if a requested facet is not on the list of permitted facets for deployment.
    /// @param businessId The identifier of the facet that is not permitted.
    error FacetNotPermitted(bytes32 businessId);

    /// @notice Reverted if the list of business logic identifiers contains a duplicate entry.
    /// @param businessId The identifier that was duplicated in the list.
    error DuplicatedBusinessId(bytes32 businessId);

    /// @notice Reverted if a specified business logic identifier has not been registered with the factory.
    /// @param businessId The unregistered identifier.
    error CurrentIdNotRegistered(bytes32 businessId);

    /// @notice Reverted during diamond deployment if the specified initialisation facet is not
    ///         in the list of facets being deployed.
    /// @param businessId The identifier of the initialisation facet that was not found.
    error InitializationFacetNotFound(bytes32 businessId);

    /// @notice Deploys a new EIP-2535 Diamond proxy with a specified set of facets and access control.
    /// @dev This function should handle the creation of a diamond proxy, attach a set of facets
    ///      (identified by `businessIds`), and configure the access control roles. It must also
    ///      be able to execute an initialisation function on one of the specified facets.
    /// @param businessIds A list of identifiers for the specific business logic facets to attach.
    /// @param rbacs An array of access control roles to configure on the new diamond.
    /// @param initBusinessId The identifier of the facet that contains the initialisation function.
    /// @param initData The encoded call data for the initialisation function.
    function deployDiamond(
        bytes32[] calldata businessIds,
        IAccessControl.Rbac[] calldata rbacs,
        bytes32 initBusinessId,
        bytes calldata initData
    ) external;

    /// @notice Finds all proxy addresses that have been deployed incorporating a specific business logic facet.
    /// @param businessId The identifier of the business logic to search for.
    /// @return proxies An array of deployed proxy addresses associated with the given business ID.
    function getDeployedProxiesByBusinessId(
        bytes32 businessId
    ) external view returns (address[] memory proxies);

    /// @notice Retrieves all business logic identifiers associated with a specific deployed proxy address.
    /// @param proxy The address of the deployed proxy to query.
    /// @return businessIds An array of business IDs attached to the specified proxy.
    function getBusinessIdsByProxy(
        address proxy
    ) external view returns (bytes32[] memory businessIds);
}
