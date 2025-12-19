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

import {IsbeProxy} from '../../proxies/isbeproxy/IsbeProxy.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {_PROXY_FACTORY_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IAccessControlEoa} from '../../access/accessControl/IAccessControl.sol';
import {IPause} from '../../pause/IPause.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {
    _DEFAULT_ADMIN_ROLE,
    _ISBE_ROLE,
    _CONFIGURATION_MANAGER_ROLE
} from '../../constants/roles.sol';
import {IsbeProxy} from '../../proxies/isbeproxy/IsbeProxy.sol';
import {IConfigurationManagement} from '../configurationmanagement/IConfigurationManagement.sol';
import {ConfigurationManagementInternal} from '../configurationmanagement/ConfigurationManagementInternal.sol';
import {
    _ACCESS_CONTROL_RESOLVER_KEY,
    _PAUSE_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title Proxy Factory Internal
 * @author ISBE
 * @notice Abstract contract providing internal proxy factory functionality
 * @dev Inherits from ConfigurationManagementInternal and provides core
 *      logic for deploying and managing ISBE proxy contracts. Contains
 *      storage mappings and internal functions for proxy deployment
 */
abstract contract ProxyFactoryInternal is ConfigurationManagementInternal {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct ProxyFactoryStorage {
        mapping(bytes32 => mapping(uint256 => EnumerableSet.AddressSet)) configurationToProxyAddress;
        mapping(address => bytes32) proxyAddressToConfigurationId;
        mapping(address => uint256) proxyAddressToVersion;
    }

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

    function _deployUseCase(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControlEoa.Rbac[] memory _rbacs,
        bool _initPause,
        bytes32[] memory _initBusinessIds,
        bytes[] memory _initData,
        bool createTo,
        bytes32 _salt
    ) internal returns (address proxyAddress_) {
        IsbeProxy proxy = _deployIsbeProxy(
            createTo,
            _salt,
            _buildUseCaseDeployArgs(
                _configurationId,
                _version,
                _initBusinessIds,
                _initData,
                _rbacs,
                _initPause
            )
        );

        proxyAddress_ = address(proxy);

        _storeDeployedDiamond(_configurationId, _version, proxyAddress_);
    }

    function _computeAddress(
        bytes32 _configurationId,
        uint256 _version,
        bytes32[] memory _initBusinessIds,
        bytes[] memory _initData,
        IAccessControlEoa.Rbac[] memory _rbacs,
        bool _initPause,
        bytes32 _salt
    ) internal view returns (address) {
        IsbeProxy.IsbeProxyArgs memory args = _buildUseCaseDeployArgs(
            _configurationId,
            _version,
            _initBusinessIds,
            _initData,
            _rbacs,
            _initPause
        );

        return _predictAddress(_salt, args);
    }

    function _buildUseCaseDeployArgs(
        bytes32 _configurationId,
        uint256 _version,
        bytes32[] memory _initBusinessIds,
        bytes[] memory _initData,
        IAccessControlEoa.Rbac[] memory _rbacs,
        bool _initPause
    ) internal view returns (IsbeProxy.IsbeProxyArgs memory args_) {
        bytes[] memory initData_ = _addDefaultInitData(
            _initData,
            _rbacs,
            _initPause
        );
        bytes32[] memory initBusinessIds_ = _addDefaultBusinessIds(
            _initBusinessIds
        );

        uint256 length = initBusinessIds_.length;
        address[] memory _initBusinessAddresses = new address[](length);

        for (uint256 i; i < length; ) {
            _initBusinessAddresses[i] = _getFacetAddress(
                _configurationId,
                _version,
                initBusinessIds_[i]
            );
            unchecked {
                ++i;
            }
        }

        args_ = IsbeProxy.IsbeProxyArgs({
            configurationManagement: IConfigurationManagement(address(this)),
            configurationId: _configurationId,
            version: _version,
            init: _initBusinessAddresses,
            data: initData_
        });
    }

    function _getDeployedProxiesByConfiguration(
        bytes32 _configurationId,
        uint256 _version
    ) internal view returns (address[] memory proxies_) {
        proxies_ = _proxyFactoryStorage()
            .configurationToProxyAddress[_configurationId][_version]
            .values();
    }

    function _getConfigurationByProxy(
        address _proxy
    ) internal view returns (bytes32 configurationId_, uint256 version_) {
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        configurationId_ = $.proxyAddressToConfigurationId[_proxy];
        version_ = $.proxyAddressToVersion[_proxy];
    }

    function _isProxyDeployed(
        address _proxy
    ) internal view returns (bool deployed_) {
        deployed_ =
            uint256(
                _proxyFactoryStorage().proxyAddressToConfigurationId[_proxy]
            ) > 0;
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
        interfaces_[--interfacesLength] = type(IProxyFactory).interfaceId;
    }

    function _deployIsbeProxy(
        bool _createTo,
        bytes32 _salt,
        IsbeProxy.IsbeProxyArgs memory _args
    ) private returns (IsbeProxy proxy_) {
        if (_createTo) {
            address predicted = _predictAddress(_salt, _args);
            require(
                predicted.code.length == 0,
                IProxyFactory.AddressAlreadyDeployed(predicted)
            );

            return new IsbeProxy{salt: _salt}(_args);
        }

        return new IsbeProxy(_args);
    }

    function _storeDeployedDiamond(
        bytes32 _configurationId,
        uint256 _version,
        address _deployedProxyAddress
    ) private {
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        $.configurationToProxyAddress[_configurationId][_version].add(
            _deployedProxyAddress
        );
        $.proxyAddressToConfigurationId[
            _deployedProxyAddress
        ] = _configurationId;
        $.proxyAddressToVersion[_deployedProxyAddress] = _version;
    }

    function _predictAddress(
        bytes32 _salt,
        IsbeProxy.IsbeProxyArgs memory _args
    ) private view returns (address) {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xFF),
                                address(this),
                                _salt,
                                keccak256(
                                    abi.encodePacked(
                                        type(IsbeProxy).creationCode,
                                        abi.encode(_args)
                                    )
                                )
                            )
                        )
                    )
                )
            );
    }

    function _addDefaultInitData(
        bytes[] memory _initData,
        IAccessControlEoa.Rbac[] memory _rbacs,
        bool _initPause
    ) private view returns (bytes[] memory initData_) {
        uint256 initialLength = _initData.length;
        unchecked {
            initData_ = new bytes[](initialLength + 2);
        }
        for (uint256 index; index < initialLength; ) {
            initData_[index] = _initData[index];
            unchecked {
                ++index;
            }
        }
        initData_[initialLength] = abi.encodeWithSelector(
            IPause.initializePause.selector,
            _initPause
        );
        initData_[initialLength + 1] = abi.encodeWithSelector(
            IAccessControlEoa.initializeAccessControl.selector,
            _adaptRbacWithIsbeRoles(_rbacs)
        );
    }

    function _adaptRbacWithIsbeRoles(
        IAccessControlEoa.Rbac[] memory _rbacs
    ) private view returns (IAccessControlEoa.Rbac[] memory rbacs_) {
        _validateRolesThatCantBeInitializedByUser(_rbacs);
        rbacs_ = _addDefaultAdminAndIsbeRoles(
            _rbacs,
            _buildDefaultAdminRoleMembers(_msgSender(), address(this)),
            _buildIsbeRoleMembers(address(this))
        );
    }

    function _addDefaultBusinessIds(
        bytes32[] memory _initBusinessIds
    ) private pure returns (bytes32[] memory initBusinessId_) {
        uint256 length = _initBusinessIds.length;
        unchecked {
            initBusinessId_ = new bytes32[](length + 2);
        }
        for (uint256 index; index < length; ) {
            initBusinessId_[index] = _initBusinessIds[index];
            unchecked {
                ++index;
            }
        }

        initBusinessId_[length] = _PAUSE_RESOLVER_KEY;
        initBusinessId_[length + 1] = _ACCESS_CONTROL_RESOLVER_KEY;
    }

    function _validateRolesThatCantBeInitializedByUser(
        IAccessControlEoa.Rbac[] memory _rbacs
    ) private pure {
        uint256 length = _rbacs.length;
        bytes32 role;
        for (; length > 0; ) {
            unchecked {
                --length;
            }
            role = _rbacs[length].role;
            require(
                role != _DEFAULT_ADMIN_ROLE &&
                    role != _ISBE_ROLE &&
                    role != _CONFIGURATION_MANAGER_ROLE,
                IProxyFactory.ForbiddenRole(role)
            );
        }
    }

    function _addDefaultAdminAndIsbeRoles(
        IAccessControlEoa.Rbac[] memory _rbacs,
        address[] memory _defaultAdminRoleMenbers,
        address[] memory _isbeRoleMembers
    ) private pure returns (IAccessControlEoa.Rbac[] memory rbacs_) {
        uint256 length = _rbacs.length;
        unchecked {
            rbacs_ = new IAccessControlEoa.Rbac[](length + 3);
        }
        rbacs_[0] = _buildRbac(_DEFAULT_ADMIN_ROLE, _defaultAdminRoleMenbers);
        rbacs_[1] = _buildRbac(_ISBE_ROLE, _isbeRoleMembers);
        rbacs_[2] = _buildRbac(_CONFIGURATION_MANAGER_ROLE, _isbeRoleMembers);
        uint256 position = 3;
        for (uint256 index; index < length; ) {
            rbacs_[position] = _rbacs[index];
            unchecked {
                ++index;
                ++position;
            }
        }
    }

    function _buildRbac(
        bytes32 _role,
        address[] memory _members
    ) private pure returns (IAccessControlEoa.Rbac memory rbac_) {
        rbac_ = IAccessControlEoa.Rbac(_role, _members);
    }

    function _proxyFactoryStorage()
        private
        pure
        returns (ProxyFactoryStorage storage storage_)
    {
        bytes32 position = _PROXY_FACTORY_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

    function _buildDefaultAdminRoleMembers(
        address _sender,
        address _proxy
    ) private pure returns (address[] memory defaultAdminRoleMembers_) {
        if (_sender == _proxy) {
            defaultAdminRoleMembers_ = new address[](1);
            defaultAdminRoleMembers_[0] = _sender;
        } else {
            defaultAdminRoleMembers_ = new address[](2);
            defaultAdminRoleMembers_[0] = _sender;
            defaultAdminRoleMembers_[1] = _proxy;
        }
    }

    function _buildIsbeRoleMembers(
        address _proxy
    ) private pure returns (address[] memory isbeRoleMembers_) {
        isbeRoleMembers_ = new address[](1);
        isbeRoleMembers_[0] = _proxy;
    }
}
