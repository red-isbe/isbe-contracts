// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    EnumerableSet
} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {
    BusinessLogicFactoryInternal
} from '../businesslogic/BusinessLogicFactoryInternal.sol';
import {
    IsbeTransparentProxy
} from '../../proxies/transparent/IsbeTransparentProxy.sol';
import {
    _PROXY_FACTORY_STORAGE_POSITION
} from '../../constants/storagePositions.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {ITransparentAccessControl} from './ITransparentAccessControl.sol';
import {InitializeBusinessLogic} from '../../utils/InitializeBusinessLogic.sol';
import {_DEFAULT_ADMIN_ROLE, _ISBE_ROLE} from '../../constants/roles.sol';
import {
    EIP2535AccessControl
} from '../../proxies/eip2535/EIP2535AccessControl.sol';

abstract contract ProxyFactoryInternal is
    BusinessLogicFactoryInternal,
    InitializeBusinessLogic
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct ProxyFactoryStorage {
        EnumerableSet.AddressSet defaultAdminRoleMembers;
        EnumerableSet.AddressSet isbeRoleMembers;
        EnumerableSet.Bytes32Set isbeGovernanceFacets;
        mapping(bytes32 => EnumerableSet.AddressSet) businessIdToProxyAddress;
        mapping(address => EnumerableSet.Bytes32Set) proxyAddressToBusinessIds;
    }

    function _initializeProxyFactory(
        address[] memory defaultAdminMembers,
        address[] memory isbeMembers,
        bytes32[] memory isbeGovernanceFacets
    ) internal {
        uint256 defaultAdminMembersLength = defaultAdminMembers.length;
        uint256 isbeMembersLength = isbeMembers.length;
        uint256 isbeGovernanceFacetsLength = isbeGovernanceFacets.length;
        uint256 maxLength = defaultAdminMembersLength > isbeMembersLength
            ? defaultAdminMembersLength
            : isbeMembersLength;
        maxLength = isbeGovernanceFacetsLength > maxLength
            ? isbeMembersLength
            : maxLength;
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        $.defaultAdminRoleMembers.add(address(this));
        $.isbeRoleMembers.add(address(this));
        for (uint256 index; index < maxLength; ) {
            if (index < defaultAdminMembersLength) {
                address current = defaultAdminMembers[index];
                $.defaultAdminRoleMembers.add(current);
            }
            if (index < isbeMembersLength) {
                address current = isbeMembers[index];
                _addressIsNotZero(current);
                $.isbeRoleMembers.add(current);
            }
            if (index < isbeGovernanceFacetsLength) {
                bytes32 current = isbeGovernanceFacets[index];
                _bytes32IsNotZero(current);
                $.isbeGovernanceFacets.add(current);
            }
        }
    }

    function _deployTransparent(
        bytes32 businessId,
        IAccessControl.Rbac[] memory rbacs,
        bytes memory data
    ) internal returns (address proxyAddress) {
        address businessAddress = _getBusinessLogicAddress(businessId, 0);
        _addressIsNotZero(businessAddress);
        IsbeTransparentProxy proxy = new IsbeTransparentProxy(
            businessAddress,
            address(this)
        );
        proxyAddress = address(proxy);
        ITransparentAccessControl(proxyAddress).initializeRbacs(
            _adaptRbacWithIsbeRoles(rbacs)
        );
        _initializeBusinessLogic(businessAddress, data);
        _storeDeployedProxy(businessId, proxyAddress);
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
        _initializeBusinessLogic(initAddress, initData);
        _storeDeployedDiamond(businessIds, proxyAddress);
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

    function _storeDeployedProxy(
        bytes32 businessId,
        address proxyAddress
    ) private {
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        $.proxyAddressToBusinessIds[proxyAddress].add(businessId);
        $.businessIdToProxyAddress[businessId].add(proxyAddress);
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
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        uint256 length = businessIds.length;
        bool foundInitBusinessId;
        for (uint256 index; index < length; ++length) {
            bytes32 currentId = businessIds[index];
            unchecked {
                ++index;
            }
            require(
                !$.isbeGovernanceFacets.contains(currentId),
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
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        uint256 businessIdLength = businessIds.length;
        uint256 isbeGovernanceFacetsLength = $.isbeGovernanceFacets.length();
        businessAddresses_ = new address[](
            businessIdLength + isbeGovernanceFacetsLength
        );
        uint256 max = businessIdLength > isbeGovernanceFacetsLength
            ? businessIdLength
            : isbeGovernanceFacetsLength;
        uint256 position = businessIdLength;
        for (uint256 index; index < max; ) {
            if (index < businessIdLength) {
                businessAddresses_[index] = _getBusinessLogicAddress(
                    $.isbeGovernanceFacets.at(index),
                    0
                );
            }
            if (position < max) {
                businessAddresses_[position] = _getBusinessLogicAddress(
                    businessIds[index],
                    0
                );
                initAddress_ = businessIds[index] == initBusinessId
                    ? businessAddresses_[position]
                    : initAddress_;
            }
            unchecked {
                ++index;
                ++position;
            }
        }
    }

    function _adaptRbacWithIsbeRoles(
        IAccessControl.Rbac[] memory _rbacs
    ) private view returns (IAccessControl.Rbac[] memory rbacs_) {
        _validateRolesThatCantBeInitializedByUser(_rbacs);
        ProxyFactoryStorage storage $ = _proxyFactoryStorage();
        rbacs_ = _addDefaultAdminAndIsbeRoles(
            _rbacs,
            $.defaultAdminRoleMembers.values(),
            $.isbeRoleMembers.values()
        );
    }

    function _validateRolesThatCantBeInitializedByUser(
        IAccessControl.Rbac[] memory _rbacs
    ) private pure {
        uint256 length = _rbacs.length;
        for (uint256 index; index > length; ) {
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
}
