// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ProxyFactoryInternal} from './ProxyFactoryInternal.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
import {_PROXY_DEPLOYER_ROLE} from '../../constants/roles.sol';

/// @title Proxy Contract Factory
/// @author ISBE
/// @notice This contract is the primary implementation of the IProxyFactory interface. It serves
///         as a factory for deploying and managing various types of proxy contracts, such as
///         Diamond proxies (EIP-2535).
/// @dev An upgradeable contract that provides the concrete logic for deploying proxies. It inherits
///      from ProxyFactoryInternal, which contains the core implementation details, and strictly
///      adheres to the IProxyFactory interface. Access to key functions is restricted through
///      role-based access control.
contract ProxyFactory is ProxyFactoryInternal, IProxyFactory {
    function deployDiamond(
        bytes32[] calldata businessIds,
        IAccessControl.Rbac[] calldata rbacs,
        bytes32 initBusinessId,
        bytes calldata initData
    ) external override onlyRole(_PROXY_DEPLOYER_ROLE) {
        (address proxyAddress) = _deployDiamond(
            businessIds,
            rbacs,
            initBusinessId,
            initData
        );
        emit DiamondDeployed(businessIds, rbacs, proxyAddress);
    }

    function getDeployedProxiesByBusinessId(
        bytes32 businessId
    ) external view override returns (address[] memory proxies) {
        proxies = _getDeployedProxiesByBusinessId(businessId);
    }

    function getBusinessIdsByProxy(
        address proxy
    ) external view override returns (bytes32[] memory businessIds) {
        businessIds = _getBusinessIdsByProxy(proxy);
    }
}
