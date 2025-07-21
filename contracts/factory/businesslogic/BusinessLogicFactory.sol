// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BusinessLogicFactoryInternal} from './BusinessLogicFactoryInternal.sol';
import {IBusinessLogicFactory} from './IBusinessLogicFactory.sol';
import {_BUSINESS_LOGIC_DEPLOYER_ROLE} from '../../constants/roles.sol';

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
        bytes32 _businessId,
        bytes calldata _bytecode
    )
        external
        override
        onlyRole(_BUSINESS_LOGIC_DEPLOYER_ROLE)
        bytes32IsNotZero(_businessId)
        emptyCode(_bytecode)
    {
        (address businessLogicAddress, uint256 version) = _deploy(
            _businessId,
            _bytecode
        );
        emit Deployed(_businessId, businessLogicAddress, version);
    }

    function getBusinessLogicAddress(
        bytes32 _businessId,
        uint256 _versionNumber
    ) external view override returns (address businessLogicAddress_) {
        businessLogicAddress_ = _getBusinessLogicAddress(
            _businessId,
            _versionNumber
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
        bytes32 _businessId
    ) external view returns (address[] memory versions_) {
        versions_ = _getBusinessLogicVersions(_businessId);
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
        interfaces_[--interfacesLength] = type(IBusinessLogicFactory)
            .interfaceId;
    }
}
