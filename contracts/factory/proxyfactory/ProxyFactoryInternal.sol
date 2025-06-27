// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    BusinessLogicFactoryInternal
} from '../businesslogic/BusinessLogicFactoryInternal.sol';
import {
    EIP2535AccessControl
} from '../../proxies/eip2535/EIP2535AccessControl.sol';
import {
    EnumerableSet
} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {
    _DIAMOND_LOUPE_RESOLVER_KEY,
    _DIAMOND_CUT_RESOLVER_KEY,
    _ACCESS_CONTROL_RESOLVER_KEY,
    _PAUSE_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {
    _PROXY_FACTORY_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
import {IPause} from '../../pause/IPause.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {InitializeBusinessLogic} from '../../utils/InitializeBusinessLogic.sol';
import {_DEFAULT_ADMIN_ROLE, _ISBE_ROLE} from '../../constants/roles.sol';

/// @title Internal Logic for the Proxy Factory
/// @author ISBE
/// @notice This abstract contract contains the internal functions and storage for creating and
///         managing proxy contracts. It is not intended for direct deployment but serves as the
///         core implementation layer for the public-facing `ProxyFactory`.
/// @dev Implements the internal logic required by `ProxyFactory`. It manages storage using a
///      dedicated struct to prevent storage collisions in an upgradeable context. It inherits
///      from `BusinessLogicFactoryInternal` to access business logic registration and from
///      `InitializeBusinessLogic` for initialisation capabilities.
abstract contract ProxyFactoryInternal is
    BusinessLogicFactoryInternal,
    InitializeBusinessLogic
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /// @dev Defines the storage layout for the proxy factory. Using a struct at a fixed
    ///      storage slot helps prevent storage collisions across upgrades.
    struct ProxyFactoryStorage {
        // A mapping from a business logic ID to all proxy addresses that use it.
        mapping(bytes32 => EnumerableSet.AddressSet) businessIdToProxyAddress;
        // A mapping from a proxy address to all the business logic IDs it uses.
        mapping(address => EnumerableSet.Bytes32Set) proxyAddressToBusinessIds;
    }

    function _deployDiamond(
        bytes32[] memory businessIds,
        IAccessControl.Rbac[] memory rbacs,
        bytes32 initBusinessId,
        bytes memory initData
    ) internal returns (address proxyAddress) {
        (
            address[] memory businessAddresses,
            address initAddress
        ) = _validateAndBuildBusinessAddresses(businessIds, initBusinessId);
        EIP2535AccessControl proxy = new EIP2535AccessControl(
            businessAddresses,
            EIP2535AccessControl.DiamondArgs(
                _adaptRbacWithIsbeRoles(rbacs),
                initAddress,
                initData
            )
        );
        proxyAddress = address(proxy);
        IPause(proxyAddress).initializePause(false);
        _initializeBusinessLogic(initAddress, initData);
        _storeDeployedDiamond(businessIds, proxyAddress);
    }

    function _getDeployedProxiesByBusinessId(
        bytes32 businessId
    ) internal view returns (address[] memory proxies) {
        proxies = _proxyFactoryStorage()
            .businessIdToProxyAddress[businessId]
            .values();
    }

    function _getBusinessIdsByProxy(
        address proxy
    ) internal view returns (bytes32[] memory businessIds) {
        businessIds = _proxyFactoryStorage()
            .proxyAddressToBusinessIds[proxy]
            .values();
    }

    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IProxyFactory).interfaceId;
    }

    function _storeDeployedDiamond(
        bytes32[] memory businessIds,
        address deployedProxyAddress
    ) private {
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        uint256 length = businessIds.length;
        for (uint256 index; index < length; ) {
            bytes32 current = businessIds[index];
            $.businessIdToProxyAddress[current].add(deployedProxyAddress);
            $.proxyAddressToBusinessIds[deployedProxyAddress].add(current);
            unchecked {
                ++index;
            }
        }
    }

    function _validateAndBuildBusinessAddresses(
        bytes32[] memory businessIds,
        bytes32 initBusinessId
    )
        private
        view
        returns (address[] memory businessAddresses_, address initAddress_)
    {
        _validateBusinessIds(businessIds, initBusinessId);
        (
            businessAddresses_,
            initAddress_
        ) = _addGovernanceFacetsAndBuildAddressList(
                businessIds,
                initBusinessId
            );
    }

    function _validateBusinessIds(
        bytes32[] memory businessIds,
        bytes32 initBusinessId
    ) private view {
        uint256 length = businessIds.length;
        require(length > 0, IProxyFactory.NotEmptyBusinessIds());
        bool foundInitBusinessId;
        for (uint256 index; index < length; ) {
            bytes32 currentId = businessIds[index];
            _bytes32IsNotZero(currentId);
            unchecked {
                ++index;
            }
            require(
                _isNotAGovernanceFacet(currentId),
                IProxyFactory.FacetNotPermitted(currentId)
            );
            require(
                _isDeployedBusinessLogic(currentId),
                IProxyFactory.CurrentIdNotRegistered(currentId)
            );
            foundInitBusinessId =
                foundInitBusinessId ||
                currentId == initBusinessId;
            for (uint256 otherIndex = index; otherIndex < length; ) {
                require(
                    currentId != businessIds[otherIndex],
                    IProxyFactory.DuplicatedBusinessId(currentId)
                );
                unchecked {
                    ++otherIndex;
                }
            }
        }
        if (initBusinessId != bytes32(0)) {
            require(
                foundInitBusinessId,
                IProxyFactory.InitializationFacetNotFound(initBusinessId)
            );
        }
    }

    function _addGovernanceFacetsAndBuildAddressList(
        bytes32[] memory businessIds,
        bytes32 initBusinessId
    )
        private
        view
        returns (address[] memory businessAddresses_, address initAddress_)
    {
        uint256 businessIdsLength = businessIds.length;
        uint256 businessAddressesLength = businessIdsLength + 4;
        businessAddresses_ = new address[](businessAddressesLength);
        for (uint256 index; index < businessIdsLength; ) {
            businessAddresses_[index] = _getBusinessLogicAddress(
                businessIds[index],
                0
            );
            initAddress_ = businessIds[index] == initBusinessId
                ? businessAddresses_[index]
                : initAddress_;
            unchecked {
                ++index;
            }
        }
        businessAddresses_[
            --businessAddressesLength
        ] = _getBusinessLogicAddress(_DIAMOND_LOUPE_RESOLVER_KEY, 0);
        businessAddresses_[
            --businessAddressesLength
        ] = _getBusinessLogicAddress(_DIAMOND_CUT_RESOLVER_KEY, 0);
        businessAddresses_[
            --businessAddressesLength
        ] = _getBusinessLogicAddress(_PAUSE_RESOLVER_KEY, 0);
        businessAddresses_[
            --businessAddressesLength
        ] = _getBusinessLogicAddress(_ACCESS_CONTROL_RESOLVER_KEY, 0);
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
        for (uint256 index; index < length; ) {
            require(
                _rbacs[index].role != _DEFAULT_ADMIN_ROLE &&
                    _rbacs[index].role != _ISBE_ROLE,
                IProxyFactory.ForbiddenRole(_rbacs[index].role)
            );
            unchecked {
                ++index;
            }
        }
    }

    function _addDefaultAdminAndIsbeRoles(
        IAccessControl.Rbac[] memory _rbacs,
        address[] memory _defaultAdminRoleMenbers,
        address[] memory _isbeRoleMembers
    ) private pure returns (IAccessControl.Rbac[] memory rbacs_) {
        uint256 length = _rbacs.length;
        rbacs_ = new IAccessControl.Rbac[](length + 2);
        rbacs_[0] = _buildRbac(_DEFAULT_ADMIN_ROLE, _defaultAdminRoleMenbers);
        rbacs_[1] = _buildRbac(_ISBE_ROLE, _isbeRoleMembers);
        for (uint256 index; index < length; ) {
            rbacs_[index + 2] = _rbacs[index];
            unchecked {
                ++index;
            }
        }
    }

    function _buildRbac(
        bytes32 role,
        address[] memory members
    ) private pure returns (IAccessControl.Rbac memory rbac_) {
        rbac_ = IAccessControl.Rbac(role, members);
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
        address sender,
        address proxy
    ) private pure returns (address[] memory defaultAdminRoleMembers) {
        defaultAdminRoleMembers = new address[](2);
        defaultAdminRoleMembers[0] = sender;
        defaultAdminRoleMembers[1] = proxy;
    }

    function _buildIsbeRoleMembers(
        address proxy
    ) private pure returns (address[] memory isbeRoleMembers) {
        isbeRoleMembers = new address[](1);
        isbeRoleMembers[0] = proxy;
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
}
