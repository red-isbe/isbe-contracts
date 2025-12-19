// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {ProxyFactoryInternal} from './ProxyFactoryInternal.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {IAccessControlEoa} from '../../access/accessControl/IAccessControl.sol';
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
abstract contract ProxyFactory is ProxyFactoryInternal, IProxyFactory {
    function deployUseCase(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControlEoa.Rbac[] calldata _rbacs,
        bool _initPause,
        bytes32[] calldata _initBusinessIds,
        bytes[] calldata _initData
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
            _initPause,
            _initBusinessIds,
            _initData,
            false,
            '0x0'
        );
        emit UseCaseDeployed(_configurationId, _version, _rbacs, proxyAddress);
    }

    function deployUseCaseTo(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControlEoa.Rbac[] calldata _rbacs,
        bool _initPause,
        bytes32[] calldata _initBusinessIds,
        bytes[] calldata _initData,
        bytes32 _salt
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
            _initPause,
            _initBusinessIds,
            _initData,
            true,
            _salt
        );
        emit UseCaseDeployed(_configurationId, _version, _rbacs, proxyAddress);
    }

    function getDeployedProxiesByConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view override returns (address[] memory proxies_) {
        proxies_ = _getDeployedProxiesByConfiguration(
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
        returns (bytes32 configurationId_, uint256 version_)
    {
        (configurationId_, version_) = _getConfigurationByProxy(_proxy);
    }
}
