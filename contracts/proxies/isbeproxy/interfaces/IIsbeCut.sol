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

import {
    IConfigurationManagement
} from '../../../factory/configurationmanagement/IConfigurationManagement.sol';

/**
 * @title IIsbeCut
 * @notice Interface for applying a registered configuration to an ISBE proxy.
 * @dev Provides a function to perform a diamond cut on a proxy using a
 * pre-registered configuration ID, separating management from execution.
 * @author ISBE
 */
interface IIsbeCut {
    /**
     * @notice Emitted when an ISBE proxy configuration is set
     * @param configumrationManagement The configuration management contract address
     * @param configurationId The identifier of the configuration
     * @param version The version number of the configuration
     */
    event IsbeProxyConfigurationSet(
        address configumrationManagement,
        bytes32 configurationId,
        uint256 version,
        address[] initAddresses,
        bytes[] initData
    );

    /**
     * @notice Sets the ISBE proxy configuration from an external management contract
     * @dev Updates the proxy configuration using the specified management contract
     * @param _configurationManagement The configuration management contract instance
     * @param _configurationId The identifier of the configuration to set
     * @param _version The version number of the configuration to apply
     */
    function setIsbeProxyConfiguration(
        IConfigurationManagement _configurationManagement,
        bytes32 _configurationId,
        uint256 _version,
        address[] calldata _init,
        bytes[] calldata _data
    ) external;
}
