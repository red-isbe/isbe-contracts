// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BusinessLogicFactoryInternal} from './BusinessLogicFactoryInternal.sol';
import {IBusinessLogicFactory} from './IBusinessLogicFactory.sol';
import {_ISBE_ROLE} from '../../constants/roles.sol';

/**
 * @title BusinessLogicFactory
 * @author ISBE
 * @notice A factory contract for deploying and managing versioned business logic contracts.
 * @dev This contract serves as the public-facing entry point for the business logic
 * deployment system. It implements the `IBusinessLogicFactory` interface and inherits
 * the core deployment and storage logic from `BusinessLogicFactoryInternal`.
 * Access to state-changing functions is restricted by role-based access control.
 */
contract BusinessLogicFactory is
    BusinessLogicFactoryInternal,
    IBusinessLogicFactory
{
    function deploy(
        bytes32 businessId,
        bytes calldata bytecode
    )
        external
        override
        onlyRole(_ISBE_ROLE)
        bytes32IsNotZero(businessId)
        emptyCode(bytecode)
    {
        (address businessLogicAddress, uint256 version) = _deploy(
            businessId,
            bytecode
        );
        emit Deployed(businessId, businessLogicAddress, version);
    }

    function getBusinessLogicAddress(
        bytes32 businessId,
        uint256 versionNumber
    ) external view override returns (address businessLogicAddress_) {
        businessLogicAddress_ = _getBusinessLogicAddress(
            businessId,
            versionNumber
        );
    }

    function getBusinessLogics()
        external
        view
        override
        returns (bytes32[] memory businessLogicIds_)
    {
        businessLogicIds_ = _getBusinessLogics();
    }

    function getBusinessLogicVersions(
        bytes32 businessId
    ) external view returns (address[] memory versions_) {
        versions_ = _getBusinessLogicVersions(businessId);
    }
}
