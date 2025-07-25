// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IConfigurationManagement} from '../../../factory/configurationmanagement/IConfigurationManagement.sol';

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
        uint256 version
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
        uint256 _version
    ) external;
}
