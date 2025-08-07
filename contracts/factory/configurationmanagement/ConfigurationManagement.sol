// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ConfigurationManagementInternal} from './ConfigurationManagementInternal.sol';
import {IConfigurationManagement} from './IConfigurationManagement.sol';
import {IDiamondLoupe} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';
import {_GOVERNANCE_CONFIGURATION_MANAGER_ROLE} from '../../constants/roles.sol';

/**
 * @title Configuration Management
 * @author ISBE
 * @notice Manages the configuration of different use cases. It maps business
 *         logic facets to specific configurations, enabling versioning and the
 *         dynamic upgrading of system capabilities.
 * @dev Implements `IConfigurationManagement`. It provides the public interface
 *      for administrators to define and manage which facets are part of a given
 *      use-case configuration. It relies on internal logic to handle storing
 *      and retrieving these configurations.
 */
abstract contract ConfigurationManagement is
    ConfigurationManagementInternal,
    IConfigurationManagement
{
    function setConfiguration(
        bytes32 _configurationId,
        BusinessData[] calldata _businessIds
    )
        external
        override
        onlyRole(_GOVERNANCE_CONFIGURATION_MANAGER_ROLE)
        bytes32IsNotZero(_configurationId)
    {
        emit ConfigurationSet(
            _configurationId,
            _businessIds,
            _setConfiguration(_configurationId, _businessIds)
        );
    }

    function getConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view override returns (BusinessData[] memory businessData_) {
        businessData_ = _getConfiguration(_configurationId, _version);
    }

    function checkConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) external view override {
        _checkConfiguration(_configurationId, _version);
    }

    function facets(
        bytes32 _configurationId,
        uint256 _version
    ) external view override returns (IDiamondLoupe.Facet[] memory facets_) {
        facets_ = _getFacets(_configurationId, _version);
    }

    function facetFunctionSelectors(
        bytes32 _configurationId,
        uint256 _version,
        address _facet
    ) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = _facetFunctionSelectors(
            _configurationId,
            _version,
            _facet
        );
    }

    function facetAddresses(
        bytes32 _configurationId,
        uint256 _version
    ) external view override returns (address[] memory facetAddresses_) {
        facetAddresses_ = _facetAddresses(_configurationId, _version);
    }

    function facetAddress(
        bytes32 _configurationId,
        uint256 _version,
        bytes4 _functionSelector
    ) external view override returns (address facetAddress_) {
        facetAddress_ = _facetAddress(
            _configurationId,
            _version,
            _functionSelector
        );
    }

    function facetSupportsInterface(
        bytes32 _configurationId,
        uint256 _version,
        bytes4 _interfaceId
    ) external view override returns (bool supported_) {
        supported_ = _facetSupportsInterface(
            _configurationId,
            _version,
            _interfaceId
        );
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IConfigurationManagement)
            .interfaceId;
    }
}
