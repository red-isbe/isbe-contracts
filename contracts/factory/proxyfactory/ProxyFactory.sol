// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ProxyFactoryInternal} from './ProxyFactoryInternal.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
import {_PROXY_DEPLOYER_ROLE} from '../../constants/roles.sol';

/**
 * @title Proxy Factory
 * @author ISBE
 * @notice Main contract for deploying diamond proxy contracts with business
 *         logic configurations
 * @dev Inherits from ProxyFactoryInternal and implements the IProxyFactory
 *      interface. Provides role-based access control for proxy deployment
 *      and configuration management functionality
 */
contract ProxyFactory is ProxyFactoryInternal, IProxyFactory {
    /**
     * @dev Modifier to validate that a configuration exists and is valid
     * @param _configurationId The unique identifier for the configuration
     * @param _version The version number to validate
     */
    modifier onlyValidConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) {
        _checkConfiguration(_configurationId, _version);
        _;
    }

    function deployUseCase(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControl.Rbac[] calldata _rbacs,
        bytes32 _initBusinessId,
        bytes calldata _initData
    )
        external
        override
        onlyRole(_PROXY_DEPLOYER_ROLE)
        bytes32IsNotZero(_configurationId)
        onlyValidConfiguration(_configurationId, _version)
    {
        (address proxyAddress) = _deployUseCase(
            _configurationId,
            _version,
            _rbacs,
            _initBusinessId,
            _initData
        );
        emit UseCaseDeployed(_configurationId, _version, _rbacs, proxyAddress);
    }

    function getDeployedProxiesByConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view override returns (address[] memory proxies) {
        proxies = _getDeployedProxiesByConfiguration(
            _configurationId,
            _version
        );
    }

    function getConfigurationByProxy(
        address _proxy
    )
        external
        view
        override
        returns (bytes32 configurationId, uint256 version)
    {
        (configurationId, version) = _getConfigurationByProxy(_proxy);
    }
}
