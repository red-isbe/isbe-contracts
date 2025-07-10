// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    ConfigurationManagementInternal
} from './ConfigurationManagementInternal.sol';
import {IConfigurationManagement} from './IConfigurationManagement.sol';
import {
    IDiamondLoupe
} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';
import {
    _GOVERNANCE_CONFIGURATION_MANAGER_ROLE
} from '../../constants/roles.sol';

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
contract ConfigurationManagement is
    ConfigurationManagementInternal,
    IConfigurationManagement
{
    function setConfiguration(
        bytes32 configurationId,
        BusinessData[] calldata businessIds
    )
        external
        override
        onlyRole(_GOVERNANCE_CONFIGURATION_MANAGER_ROLE)
        bytes32IsNotZero(configurationId)
    {
        emit ConfigurationSet(
            configurationId,
            businessIds,
            _setConfiguration(configurationId, businessIds)
        );
    }

    function getConfiguration(
        bytes32 configurationId,
        uint256 version
    ) external view override returns (BusinessData[] memory businessData_) {
        businessData_ = _getConfiguration(configurationId, version);
    }

    function facets(
        bytes32 configurationId,
        uint256 version
    ) external view override returns (IDiamondLoupe.Facet[] memory facets_) {
        facets_ = _getFacets(configurationId, version);
    }

    function facetFunctionSelectors(
        bytes32 configurationId,
        uint256 version,
        address facet
    ) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = _facetFunctionSelectors(
            configurationId,
            version,
            facet
        );
    }

    function facetAddresses(
        bytes32 configurationId,
        uint256 version
    ) external view override returns (address[] memory facetAddresses_) {
        facetAddresses_ = _facetAddresses(configurationId, version);
    }

    function facetAddress(
        bytes32 configurationId,
        uint256 version,
        bytes4 functionSelector
    ) external view override returns (address facetAddress_) {
        facetAddress_ = _facetAddress(
            configurationId,
            version,
            functionSelector
        );
    }

    function facetSupportsInterface(
        bytes32 configurationId,
        uint256 version,
        bytes4 interfaceId
    ) external view override returns (bool supported_) {
        supported_ = _facetSupportsInterface(
            configurationId,
            version,
            interfaceId
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
