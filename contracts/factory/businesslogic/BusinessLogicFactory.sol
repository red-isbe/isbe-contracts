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
abstract contract BusinessLogicFactory is
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
        emptyBytes(_bytecode)
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
