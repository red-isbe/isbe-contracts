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
    /// @notice Emitted when a new transparent proxy has been successfully deployed and initialised.
    /// @param businessId A unique identifier for the business logic (implementation) contract.
    /// @param rbacs The Role-Based Access Control (RBAC) settings applied during initialisation.
    /// @param proxy The address of the newly created transparent proxy contract.
    event TransparentDeployed(
        bytes32 businessId,
        IAccessControl.Rbac[] rbacs,
        address proxy
    );

    /// @notice Emitted when a new diamond proxy has been successfully deployed and initialised.
    /// @param businessIds Identifiers for all the business logic facets attached to the diamond.
    /// @param rbacs The Role-Based Access Control (RBAC) settings applied during initialisation.
    /// @param proxy The address of the newly created diamond proxy contract.
    event DiamondDeployed(
        bytes32[] businessIds,
        IAccessControl.Rbac[] rbacs,
        address proxy
    );

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

    /// @notice Initialises the proxy factory with its core administrative and governance settings.
    /// @dev Sets up the initial access control for the factory contract itself. This function should
    ///      be called once upon deployment to grant the necessary administrative roles and configure
    ///      any associated governance mechanisms.
    /// @param defaultAdminMembers The list of addresses to be granted the default admin role.
    /// @param isbeMembers The list of addresses to be granted a specific ISBE operational role.
    /// @param isbeGovernanceFacets The encoded data for any governance facets to be configured.
    function initializeProxyFactory(
        address[] memory defaultAdminMembers,
        address[] memory isbeMembers,
        bytes32[] memory isbeGovernanceFacets
    ) external;

    /// @notice Deploys a new transparent proxy contract with specified logic and access control.
    /// @dev This function should handle the creation of a new transparent upgradeable proxy,
    ///      link it to an implementation contract (identified by `businessId`), and execute its
    ///      initialisation routine using the provided `initData`.
    /// @param businessId The identifier for the business logic (implementation) contract.
    /// @param rbacs An array of access control roles to configure on the new proxy.
    /// @param initData The encoded function call data used to initialise the proxy's state.
    function deployTransparent(
        bytes32 businessId,
        IAccessControl.Rbac[] calldata rbacs,
        bytes calldata initData
    ) external;

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
}
