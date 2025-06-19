// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ProxyFactoryInternal} from './ProxyFactoryInternal.sol';
import {IProxyFactory} from './IProxyFactory.sol';
import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';
import {_PROXY_DEPLOYER_ROLE} from '../../constants/roles.sol';
import {_PROXY_FACTORY_RESOLVER_KEY} from '../../constants/resolverKeys.sol';

contract ProxyFactory is ProxyFactoryInternal, IProxyFactory {
    function initializeProxyFactory(
        address[] memory defaultAdminMembers,
        address[] memory isbeMembers,
        bytes32[] memory isbeGovernanceFacets
    ) external override initializer(_PROXY_FACTORY_RESOLVER_KEY) {
        _initializeProxyFactory(
            defaultAdminMembers,
            isbeMembers,
            isbeGovernanceFacets
        );
    }

    function deployTransparent(
        bytes32 businessId,
        IAccessControl.Rbac[] calldata rbacs,
        bytes calldata initData
    )
        external
        override
        onlyRole(_PROXY_DEPLOYER_ROLE)
        bytes32IsNotZero(businessId)
    {
        (address proxyAddress) = _deployTransparent(
            businessId,
            rbacs,
            initData
        );
        emit TransparentDeployed(businessId, rbacs, proxyAddress);
    }
    function deployDiamond(
        bytes32[] calldata businessIds,
        IAccessControl.Rbac[] calldata rbacs,
        bytes32 initBusinessId,
        bytes calldata initData
    ) external override onlyRole(_PROXY_DEPLOYER_ROLE) {
        (address proxyAddress) = _deployDiamond(
            businessIds,
            rbacs,
            initBusinessId,
            initData
        );
        emit DiamondDeployed(businessIds, rbacs, proxyAddress);
    }
}
