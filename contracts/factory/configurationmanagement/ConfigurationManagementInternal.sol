// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BusinessLogicFactoryInternal} from '../businesslogic/BusinessLogicFactoryInternal.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {IDiamondLoupe} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';
import {IEIP2535Introspection} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_CONFIGURATION_MANAGEMENT_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {
    _DIAMOND_LOUPE_RESOLVER_KEY,
    _DIAMOND_CUT_RESOLVER_KEY,
    _ACCESS_CONTROL_RESOLVER_KEY,
    _PAUSE_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {IConfigurationManagement} from './IConfigurationManagement.sol';
import {IProxyFactory} from '../proxyfactory/IProxyFactory.sol';
import {InitializeBusinessLogic} from '../../utils/InitializeBusinessLogic.sol';

/**
 * @title Internal Configuration Management Logic
 * @author ISBE
 * @notice Handles the internal logic for creating and managing use-case configurations.
 * @dev This abstract contract provides the core storage and functions for use-case
 *      configurations. It is designed to be inherited by a public-facing contract.
 *      It manages versioning and the association of business logic facets.
 */
abstract contract ConfigurationManagementInternal is
    BusinessLogicFactoryInternal,
    InitializeBusinessLogic
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct ConfigurationManagementStorage {
        mapping(bytes32 => uint256) latestVersion;
        mapping(bytes32 => mapping(uint256 => EnumerableSet.Bytes32Set)) businessIds;
        mapping(bytes32 => mapping(uint256 => mapping(bytes32 => uint256))) businessVersions;
        mapping(bytes32 => mapping(uint256 => EnumerableSet.AddressSet)) facetAddresses;
        mapping(bytes32 => mapping(uint256 => mapping(address => bytes4[]))) functionSelectors;
        mapping(bytes32 => mapping(uint256 => mapping(bytes4 => address))) selectorToFacet;
        mapping(bytes32 => mapping(uint256 => mapping(bytes4 => bool))) supportsInterface;
    }

    function _setConfiguration(
        bytes32 configurationId,
        IConfigurationManagement.BusinessData[] calldata businessData
    ) internal returns (uint256 version_) {
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        (
            IConfigurationManagement.BusinessData[] memory integratedBusinessData,
            address[] memory facetAddresses
        ) = _validateAndBuildBusinessAddresses(businessData);
        version_ = ++$.latestVersion[configurationId];
        uint256 length = integratedBusinessData.length;
        IConfigurationManagement.BusinessData memory data;
        address facetAddress;
        for (uint256 index; index < length; ) {
            data = integratedBusinessData[index];
            facetAddress = facetAddresses[index];
            $.businessIds[configurationId][version_].add(data.businessId);
            $.businessVersions[configurationId][version_][
                data.businessId
            ] = data.version;
            $.facetAddresses[configurationId][version_].add(facetAddress);
            _storeFunctionSelectors($, configurationId, version_, facetAddress);
            _storeSupportedInterfaces(
                $,
                configurationId,
                version_,
                facetAddress
            );
            unchecked {
                ++index;
            }
        }
    }

    function _getConfiguration(
        bytes32 configurationId,
        uint256 configurationVersion
    )
        internal
        view
        returns (IConfigurationManagement.BusinessData[] memory businessData_)
    {
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        uint256 version = _latest(configurationId, configurationVersion);
        EnumerableSet.Bytes32Set storage businessIds = $.businessIds[
            configurationId
        ][version];
        uint256 length = businessIds.length();
        businessData_ = new IConfigurationManagement.BusinessData[](length);
        bytes32 businessId;
        for (uint256 index; index < length; ) {
            businessId = businessIds.at(index);
            businessData_[index] = _buildBusinessData(
                businessId,
                $.businessVersions[configurationId][version][businessId]
            );
            unchecked {
                ++index;
            }
        }
    }

    function _getFacets(
        bytes32 configurationId,
        uint256 _version
    ) internal view returns (IDiamondLoupe.Facet[] memory facets) {
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        uint256 version = _latest(configurationId, _version);
        address[] memory facetAddresses = $
            .facetAddresses[configurationId][version]
            .values();
        uint256 length = facetAddresses.length;
        facets = new IDiamondLoupe.Facet[](length);
        for (uint256 index; index < length; ) {
            address current = facetAddresses[index];
            facets[index] = _buildFacet(
                current,
                $.functionSelectors[configurationId][
                    _latest(configurationId, version)
                ][current]
            );
            unchecked {
                ++index;
            }
        }
    }

    function _facetFunctionSelectors(
        bytes32 configurationId,
        uint256 version,
        address facetAddress
    ) internal view returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = _configurationManagementStorage()
            .functionSelectors[configurationId][
                _latest(configurationId, version)
            ][facetAddress];
    }

    function _facetAddresses(
        bytes32 configurationId,
        uint256 version
    ) internal view returns (address[] memory facetAddresses_) {
        facetAddresses_ = _configurationManagementStorage()
            .facetAddresses[configurationId][_latest(configurationId, version)]
            .values();
    }

    function _facetAddress(
        bytes32 configurationId,
        uint256 version,
        bytes4 functionSelector
    ) internal view returns (address facetAddress_) {
        facetAddress_ = _configurationManagementStorage().selectorToFacet[
            configurationId
        ][_latest(configurationId, version)][functionSelector];
    }

    function _facetSupportsInterface(
        bytes32 configurationId,
        uint256 version,
        bytes4 interfaceId
    ) internal view returns (bool supported_) {
        supported_ = _configurationManagementStorage().supportsInterface[
            configurationId
        ][_latest(configurationId, version)][interfaceId];
    }

    function _storeFunctionSelectors(
        ConfigurationManagementStorage storage $,
        bytes32 configurationId,
        uint256 version,
        address facetAddress
    ) private {
        IEIP2535Introspection introspection = IEIP2535Introspection(
            facetAddress
        );
        bytes4[] memory selectors = introspection.selectorsIntrospection();
        uint256 selectorsLength = selectors.length;
        for (uint256 selectorsIndex; selectorsIndex < selectorsLength; ) {
            bytes4 selector = selectors[selectorsIndex];
            $.functionSelectors[configurationId][version][facetAddress].push(
                selector
            );
            $.selectorToFacet[configurationId][version][
                selector
            ] = facetAddress;
            unchecked {
                ++selectorsIndex;
            }
        }
    }

    function _storeSupportedInterfaces(
        ConfigurationManagementStorage storage $,
        bytes32 configurationId,
        uint256 version,
        address facetAddress
    ) private {
        IEIP2535Introspection introspection = IEIP2535Introspection(
            facetAddress
        );
        bytes4[] memory interfaces = introspection.interfacesIntrospection();
        uint256 interfacesLength = interfaces.length;
        for (uint256 interfacesIndex; interfacesIndex < interfacesLength; ) {
            $.supportsInterface[configurationId][version][
                interfaces[interfacesIndex]
            ] = true;
            unchecked {
                ++interfacesIndex;
            }
        }
    }

    function _validateAndBuildBusinessAddresses(
        IConfigurationManagement.BusinessData[] memory businessIds
    )
        private
        view
        returns (
            IConfigurationManagement.BusinessData[] memory businessIds_,
            address[] memory businessAddresses_
        )
    {
        _validateBusinessIds(businessIds);
        (
            businessIds_,
            businessAddresses_
        ) = _addGovernanceFacetsAndBuildAddressList(businessIds);
    }

    function _validateBusinessIds(
        IConfigurationManagement.BusinessData[] memory businessData
    ) private view {
        uint256 length = businessData.length;
        require(length > 0, IProxyFactory.NotEmptyBusinessIds());
        for (uint256 index; index < length; ) {
            bytes32 currentId = businessData[index].businessId;
            uint256 version = businessData[index].version;
            _bytes32IsNotZero(currentId);
            unchecked {
                ++index;
            }
            require(
                _isNotAGovernanceFacet(currentId),
                IProxyFactory.FacetNotPermitted(currentId)
            );
            require(
                _isDeployedBusinessLogic(currentId, version),
                IProxyFactory.CurrentIdNotRegistered(currentId)
            );
            for (uint256 otherIndex = index; otherIndex < length; ) {
                require(
                    currentId != businessData[otherIndex].businessId,
                    IProxyFactory.DuplicatedBusinessId(currentId)
                );
                unchecked {
                    ++otherIndex;
                }
            }
        }
    }

    function _addGovernanceFacetsAndBuildAddressList(
        IConfigurationManagement.BusinessData[] memory businessIds
    )
        private
        view
        returns (
            IConfigurationManagement.BusinessData[] memory businessData_,
            address[] memory businessAddresses_
        )
    {
        uint256 businessIdsLength = businessIds.length;
        uint256 businessAddressesLength = businessIdsLength + 4;
        businessData_ = new IConfigurationManagement.BusinessData[](
            businessAddressesLength
        );
        businessAddresses_ = new address[](businessAddressesLength);
        for (uint256 index; index < businessIdsLength; ) {
            businessData_[index] = businessIds[index];
            businessAddresses_[index] = _getBusinessLogicAddress(
                businessIds[index].businessId,
                0
            );
            unchecked {
                ++index;
            }
        }
        (
            businessAddresses_[--businessAddressesLength],
            businessData_[businessAddressesLength]
        ) = _getBusinessData(_DIAMOND_LOUPE_RESOLVER_KEY);
        (
            businessAddresses_[--businessAddressesLength],
            businessData_[businessAddressesLength]
        ) = _getBusinessData(_DIAMOND_CUT_RESOLVER_KEY);
        (
            businessAddresses_[--businessAddressesLength],
            businessData_[businessAddressesLength]
        ) = _getBusinessData(_PAUSE_RESOLVER_KEY);
        (
            businessAddresses_[--businessAddressesLength],
            businessData_[businessAddressesLength]
        ) = _getBusinessData(_ACCESS_CONTROL_RESOLVER_KEY);
    }

    function _getBusinessData(
        bytes32 businessId
    )
        private
        view
        returns (
            address facetAddress,
            IConfigurationManagement.BusinessData memory businessData_
        )
    {
        facetAddress = _getBusinessLogicAddress(businessId, 0);
        businessData_ = _buildBusinessData(businessId);
    }

    function _latest(
        bytes32 configurationId,
        uint256 version
    ) private view returns (uint256 version_) {
        version_ = version == 0
            ? _configurationManagementStorage().latestVersion[configurationId]
            : version;
    }

    function _buildFacet(
        address facetAddress,
        bytes4[] memory functionSelectors
    ) private pure returns (IDiamondLoupe.Facet memory facet_) {
        facet_ = IDiamondLoupe.Facet({
            facetAddress: facetAddress,
            functionSelectors: functionSelectors
        });
    }

    function _buildBusinessData(
        bytes32 businessId
    )
        private
        pure
        returns (IConfigurationManagement.BusinessData memory businessData_)
    {
        businessData_ = IConfigurationManagement.BusinessData({
            businessId: businessId,
            version: 0
        });
    }

    function _buildBusinessData(
        bytes32 businessId,
        uint256 version
    )
        private
        pure
        returns (IConfigurationManagement.BusinessData memory businessData_)
    {
        businessData_ = IConfigurationManagement.BusinessData({
            businessId: businessId,
            version: version
        });
    }

    function _isNotAGovernanceFacet(
        bytes32 businessId
    ) private pure returns (bool) {
        return
            businessId != _DIAMOND_CUT_RESOLVER_KEY &&
            businessId != _DIAMOND_LOUPE_RESOLVER_KEY &&
            businessId != _ACCESS_CONTROL_RESOLVER_KEY &&
            businessId != _PAUSE_RESOLVER_KEY;
    }

    function _configurationManagementStorage()
        private
        pure
        returns (ConfigurationManagementStorage storage storage_)
    {
        bytes32 position = _CONFIGURATION_MANAGEMENT_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
