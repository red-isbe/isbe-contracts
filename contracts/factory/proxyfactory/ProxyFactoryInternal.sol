// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IsbeProxy} from '../../proxies/isbeproxy/IsbeProxy.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {_PROXY_FACTORY_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
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

    function _deployUseCase(
        bytes32 _configurationId,
        uint256 _version,
        IAccessControl.Rbac[] memory _rbacs,
        bool _initPause,
        bytes32[] memory _initBusinessIds,
        bytes[] memory _initData,
        bool createTo,
        bytes32 _salt
    ) internal returns (address proxyAddress_) {
        IsbeProxy.IsbeProxyArgs memory args = _buildUseCaseDeployArgs(
            _configurationId,
            _version,
            _initBusinessIds,
            _initData
        );
        IsbeProxy proxy;

        if (createTo) {
            address predicted = address(
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
                                        abi.encode(args)
                                    )
                                )
                            )
                        )
                    )
                )
            );
            require(
                predicted.code.length == 0,
                IProxyFactory.AddressAlreadyDeployed(predicted)
            );

            proxy = new IsbeProxy{salt: _salt}(args);
        } else proxy = new IsbeProxy(args);

        proxyAddress_ = address(proxy);

        _initializeUseCase(proxyAddress_, _rbacs, _initPause);

        _storeDeployedDiamond(_configurationId, _version, proxyAddress_);
    }

    function _initializeUseCase(
        address _proxyAddress,
        IAccessControl.Rbac[] memory _rbacs,
        bool _initPause
    ) internal {
        IAccessControl(_proxyAddress).initializeAccessControl(
            _adaptRbacWithIsbeRoles(_rbacs)
        );
        IPause(_proxyAddress).initializePause(_initPause);
    }

    function _buildUseCaseDeployArgs(
        bytes32 _configurationId,
        uint256 _version,
        bytes32[] memory _initBusinessIds,
        bytes[] memory _initData
    ) internal view returns (IsbeProxy.IsbeProxyArgs memory args_) {
        uint256 length = _initBusinessIds.length;
        address[] memory _initBusinessAddresses = new address[](length);

        for (uint256 i; i < length; ) {
            _initBusinessAddresses[i] = _getFacetAddress(
                _configurationId,
                _version,
                _initBusinessIds[i]
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
            data: _initData
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

    function _adaptRbacWithIsbeRoles(
        IAccessControl.Rbac[] memory _rbacs
    ) private view returns (IAccessControl.Rbac[] memory rbacs_) {
        _validateRolesThatCantBeInitializedByUser(_rbacs);
        rbacs_ = _addDefaultAdminAndIsbeRoles(
            _rbacs,
            _buildDefaultAdminRoleMembers(_msgSender(), address(this)),
            _buildIsbeRoleMembers(address(this))
        );
    }

    function _validateRolesThatCantBeInitializedByUser(
        IAccessControl.Rbac[] memory _rbacs
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
        IAccessControl.Rbac[] memory _rbacs,
        address[] memory _defaultAdminRoleMenbers,
        address[] memory _isbeRoleMembers
    ) private pure returns (IAccessControl.Rbac[] memory rbacs_) {
        uint256 length = _rbacs.length;
        unchecked {
            rbacs_ = new IAccessControl.Rbac[](length + 3);
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
    ) private pure returns (IAccessControl.Rbac memory rbac_) {
        rbac_ = IAccessControl.Rbac(_role, _members);
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
        defaultAdminRoleMembers_ = new address[](2);
        defaultAdminRoleMembers_[0] = _sender;
        defaultAdminRoleMembers_[1] = _proxy;
    }

    function _buildIsbeRoleMembers(
        address _proxy
    ) private pure returns (address[] memory isbeRoleMembers_) {
        isbeRoleMembers_ = new address[](1);
        isbeRoleMembers_[0] = _proxy;
    }
}
