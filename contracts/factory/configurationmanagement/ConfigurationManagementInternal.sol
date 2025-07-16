// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _DIAMOND_LOUPE_RESOLVER_KEY,
    _DIAMOND_CUT_RESOLVER_KEY,
    _ACCESS_CONTROL_RESOLVER_KEY,
    _PAUSE_RESOLVER_KEY,
    _ISBE_LOUPE_RESOLVER_KEY,
    _ISBE_CUT_RESOLVER_KEY,
    _BUSINESS_LOGIC_FACTORY_RESOLVER_KEY,
    _CONFIGURATION_MANAGEMENT_RESOLVER_KEY,
    _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY,
    _PROXY_FACTORY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {
    BusinessLogicFactoryInternal
} from '../businesslogic/BusinessLogicFactoryInternal.sol';
import {
    EnumerableSet
} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {IConfigurationManagement} from './IConfigurationManagement.sol';
import {
    IDiamondLoupe
} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {IProxyFactory} from '../proxyfactory/IProxyFactory.sol';
import {InitializeBusinessLogic} from '../../utils/InitializeBusinessLogic.sol';
import {
    _CONFIGURATION_MANAGEMENT_STORAGE_POSITION
} from '../../constants/storagePositions.sol';

/**
 * @title Configuration Management Internal
 * @author ISBE
 * @notice Internal contract for managing diamond configurations and facets
 * @dev Provides internal functions for storing, retrieving, and validating
 *      diamond proxy configurations with business logic facets
 */
abstract contract ConfigurationManagementInternal is
    BusinessLogicFactoryInternal,
    InitializeBusinessLogic
{
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
        bytes32 _configurationId,
        IConfigurationManagement.BusinessData[] calldata _businessData
    ) internal returns (uint256 version_) {
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        (
            IConfigurationManagement.BusinessData[] memory integratedBusinessData,
            address[] memory facetAddresses
        ) = _validateAndBuildBusinessAddresses(_businessData);
        version_ = ++$.latestVersion[_configurationId];
        uint256 length = integratedBusinessData.length;
        IConfigurationManagement.BusinessData memory data;
        address facetAddress;
        for (uint256 index; index < length; ) {
            data = integratedBusinessData[index];
            facetAddress = facetAddresses[index];
            $.businessIds[_configurationId][version_].add(data.businessId);
            $.businessVersions[_configurationId][version_][
                data.businessId
            ] = data.version;
            $.facetAddresses[_configurationId][version_].add(facetAddress);
            _storeFunctionSelectors(
                $,
                _configurationId,
                version_,
                facetAddress
            );
            _storeSupportedInterfaces(
                $,
                _configurationId,
                version_,
                facetAddress
            );
            unchecked {
                ++index;
            }
        }
    }

    function _getConfiguration(
        bytes32 _configurationId,
        uint256 _configurationVersion
    )
        internal
        view
        returns (IConfigurationManagement.BusinessData[] memory businessData_)
    {
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        uint256 version = _latest(_configurationId, _configurationVersion);
        EnumerableSet.Bytes32Set storage businessIds = $.businessIds[
            _configurationId
        ][version];
        uint256 length = businessIds.length();
        businessData_ = new IConfigurationManagement.BusinessData[](length);
        bytes32 businessId;
        for (uint256 index; index < length; ) {
            businessId = businessIds.at(index);
            businessData_[index] = _buildBusinessData(
                businessId,
                $.businessVersions[_configurationId][version][businessId]
            );
            unchecked {
                ++index;
            }
        }
    }

    function _checkConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) internal view {
        require(
            _existsConfiguration(_configurationId, _version),
            IConfigurationManagement.InvalidConfiguration(
                _configurationId,
                _version
            )
        );
    }

    function _existsConfiguration(
        bytes32 configurationId,
        uint256 version
    ) internal view returns (bool) {
        return
            _configurationManagementStorage()
                .businessIds[configurationId][_latest(configurationId, version)]
                .length() > 0;
    }

    function _getFacetAddress(
        bytes32 _configurationId,
        uint256 _version,
        bytes32 _businessId
    ) internal view returns (address facetAddress_) {
        if (_businessId == bytes32(0)) {
            return address(0);
        }
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        uint256 version = _latest(_configurationId, _version);
        require(
            $.businessIds[_configurationId][version].contains(_businessId),
            IProxyFactory.FacetNotFound(_businessId)
        );
        facetAddress_ = _getBusinessLogicAddress(
            _businessId,
            $.businessVersions[_configurationId][version][_businessId]
        );
    }

    function _getFacets(
        bytes32 _configurationId,
        uint256 _version
    ) internal view returns (IDiamondLoupe.Facet[] memory facets) {
        ConfigurationManagementStorage
            storage $ = _configurationManagementStorage();
        uint256 version = _latest(_configurationId, _version);
        address[] memory facetAddresses = $
            .facetAddresses[_configurationId][version]
            .values();
        uint256 length = facetAddresses.length;
        facets = new IDiamondLoupe.Facet[](length);
        for (uint256 index; index < length; ) {
            address current = facetAddresses[index];
            facets[index] = _buildFacet(
                current,
                $.functionSelectors[_configurationId][
                    _latest(_configurationId, version)
                ][current]
            );
            unchecked {
                ++index;
            }
        }
    }

    function _facetFunctionSelectors(
        bytes32 _configurationId,
        uint256 _version,
        address facetAddress
    ) internal view returns (bytes4[] memory facetFunctionSelectors_) {
        facetFunctionSelectors_ = _configurationManagementStorage()
            .functionSelectors[_configurationId][
                _latest(_configurationId, _version)
            ][facetAddress];
    }

    function _facetAddresses(
        bytes32 _configurationId,
        uint256 _version
    ) internal view returns (address[] memory facetAddresses_) {
        facetAddresses_ = _configurationManagementStorage()
            .facetAddresses[_configurationId][
                _latest(_configurationId, _version)
            ]
            .values();
    }

    function _facetAddress(
        bytes32 _configurationId,
        uint256 _version,
        bytes4 _functionSelector
    ) internal view returns (address facetAddress_) {
        facetAddress_ = _configurationManagementStorage().selectorToFacet[
            _configurationId
        ][_latest(_configurationId, _version)][_functionSelector];
    }

    function _facetSupportsInterface(
        bytes32 _configurationId,
        uint256 _version,
        bytes4 _interfaceId
    ) internal view returns (bool supported_) {
        supported_ = _configurationManagementStorage().supportsInterface[
            _configurationId
        ][_latest(_configurationId, _version)][_interfaceId];
    }

    function _storeFunctionSelectors(
        ConfigurationManagementStorage storage $,
        bytes32 _configurationId,
        uint256 _version,
        address _currentFacetAddress
    ) private {
        IEIP2535Introspection introspection = IEIP2535Introspection(
            _currentFacetAddress
        );
        bytes4[] memory selectors = introspection.selectorsIntrospection();
        uint256 selectorsLength = selectors.length;
        for (uint256 selectorsIndex; selectorsIndex < selectorsLength; ) {
            bytes4 selector = selectors[selectorsIndex];
            $
                .functionSelectors[_configurationId][_version][
                    _currentFacetAddress
                ]
                .push(selector);
            $.selectorToFacet[_configurationId][_version][
                selector
            ] = _currentFacetAddress;
            unchecked {
                ++selectorsIndex;
            }
        }
    }

    function _storeSupportedInterfaces(
        ConfigurationManagementStorage storage $,
        bytes32 _configurationId,
        uint256 _version,
        address _currentFacetAddress
    ) private {
        IEIP2535Introspection introspection = IEIP2535Introspection(
            _currentFacetAddress
        );
        bytes4[] memory interfaces = introspection.interfacesIntrospection();
        uint256 interfacesLength = interfaces.length;
        for (uint256 interfacesIndex; interfacesIndex < interfacesLength; ) {
            $.supportsInterface[_configurationId][_version][
                interfaces[interfacesIndex]
            ] = true;
            unchecked {
                ++interfacesIndex;
            }
        }
    }

    function _validateAndBuildBusinessAddresses(
        IConfigurationManagement.BusinessData[] memory _businessIds
    )
        private
        view
        returns (
            IConfigurationManagement.BusinessData[] memory businessIds_,
            address[] memory businessAddresses_
        )
    {
        _validateBusinessIds(_businessIds);
        (
            businessIds_,
            businessAddresses_
        ) = _addGovernanceFacetsAndBuildAddressList(_businessIds);
    }

    function _validateBusinessIds(
        IConfigurationManagement.BusinessData[] memory _businessData
    ) private view {
        uint256 length = _businessData.length;
        require(length > 0, IProxyFactory.NotEmptyBusinessIds());
        for (uint256 index; index < length; ) {
            bytes32 currentId = _businessData[index].businessId;
            uint256 version = _businessData[index].version;
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
                    currentId != _businessData[otherIndex].businessId,
                    IProxyFactory.DuplicatedBusinessId(currentId)
                );
                unchecked {
                    ++otherIndex;
                }
            }
        }
    }

    function _addGovernanceFacetsAndBuildAddressList(
        IConfigurationManagement.BusinessData[] memory _businessIds
    )
        private
        view
        returns (
            IConfigurationManagement.BusinessData[] memory businessData_,
            address[] memory businessAddresses_
        )
    {
        uint256 businessIdsLength = _businessIds.length;
        uint256 businessAddressesLength = businessIdsLength + 4;
        businessData_ = new IConfigurationManagement.BusinessData[](
            businessAddressesLength
        );
        businessAddresses_ = new address[](businessAddressesLength);
        for (uint256 index; index < businessIdsLength; ) {
            businessData_[index] = _businessIds[index];
            businessAddresses_[index] = _getBusinessLogicAddress(
                _businessIds[index].businessId,
                0
            );
            unchecked {
                ++index;
            }
        }
        (
            businessAddresses_[--businessAddressesLength],
            businessData_[businessAddressesLength]
        ) = _getBusinessData(_ISBE_LOUPE_RESOLVER_KEY);
        (
            businessAddresses_[--businessAddressesLength],
            businessData_[businessAddressesLength]
        ) = _getBusinessData(_ISBE_CUT_RESOLVER_KEY);
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
        bytes32 _businessId
    )
        private
        view
        returns (
            address facetAddress,
            IConfigurationManagement.BusinessData memory businessData_
        )
    {
        facetAddress = _getBusinessLogicAddress(_businessId, 0);
        businessData_ = _buildBusinessData(_businessId);
    }

    function _latest(
        bytes32 _configurationId,
        uint256 _version
    ) private view returns (uint256 version_) {
        version_ = _version == 0
            ? _configurationManagementStorage().latestVersion[_configurationId]
            : _version;
    }

    function _buildFacet(
        address _currentFacetAddress,
        bytes4[] memory _functionSelectors
    ) private pure returns (IDiamondLoupe.Facet memory facet_) {
        facet_ = IDiamondLoupe.Facet({
            facetAddress: _currentFacetAddress,
            functionSelectors: _functionSelectors
        });
    }

    function _buildBusinessData(
        bytes32 _businessId
    )
        private
        pure
        returns (IConfigurationManagement.BusinessData memory businessData_)
    {
        businessData_ = IConfigurationManagement.BusinessData({
            businessId: _businessId,
            version: 0
        });
    }

    function _buildBusinessData(
        bytes32 _businessId,
        uint256 _version
    )
        private
        pure
        returns (IConfigurationManagement.BusinessData memory businessData_)
    {
        businessData_ = IConfigurationManagement.BusinessData({
            businessId: _businessId,
            version: _version
        });
    }

    function _isNotAGovernanceFacet(
        bytes32 _businessId
    ) private pure returns (bool) {
        return
            _businessId != _DIAMOND_CUT_RESOLVER_KEY &&
            _businessId != _DIAMOND_LOUPE_RESOLVER_KEY &&
            _businessId != _ACCESS_CONTROL_RESOLVER_KEY &&
            _businessId != _PAUSE_RESOLVER_KEY &&
            _businessId != _ISBE_LOUPE_RESOLVER_KEY &&
            _businessId != _ISBE_CUT_RESOLVER_KEY &&
            _businessId != _BUSINESS_LOGIC_FACTORY_RESOLVER_KEY &&
            _businessId != _CONFIGURATION_MANAGEMENT_RESOLVER_KEY &&
            _businessId != _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY &&
            _businessId != _PROXY_FACTORY_RESOLVER_KEY;
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
