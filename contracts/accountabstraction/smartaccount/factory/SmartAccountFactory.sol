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
-------------------------------------------------------------- */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '../../../access/accessControl/IAccessControlEoa.sol';
import '../../../factory/proxyfactory/ProxyFactoryInternal.sol';
import './ISmartAccountFactory.sol';
import '../../entrypoint/IEntryPoint.sol';
import '@account-abstraction/contracts/interfaces/ISenderCreator.sol';
import '@openzeppelin/contracts/utils/Create2.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165Checker.sol';
import {SmartAccountFactoryInternal} from './SmartAccountFactoryInternal.sol';
import {ERC165Internal} from '../../../core/ERC165Internal.sol';
import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {_SMART_ACCOUNT_DEPLOYER_ROLE} from '../../../constants/roles.sol';
import {
    _SMART_ACCOUNT_CONFIGURATION_ID,
    _SMART_ACCOUNT_VERSION
} from '../../../constants/values.sol';

/**
 * @title Smart Account Factory
 * @notice Provides functionality for deploying ERC-4337 smart accounts.
 * @author ISBE Development Team
 */
abstract contract SmartAccountFactory is
    ISmartAccountFactory,
    SmartAccountFactoryInternal
{
    using ERC165Checker for address;

    /// @inheritdoc ISmartAccountFactory
    function createAccount(
        address owner,
        bytes32 salt
    )
        external
        override
        onlyValidConfiguration(
            _SMART_ACCOUNT_CONFIGURATION_ID,
            _SMART_ACCOUNT_VERSION
        )
        whenNotPaused
        onlyRole(_SMART_ACCOUNT_DEPLOYER_ROLE)
        returns (address)
    {
        address sender = _msgSender();
        require(
            sender.supportsERC165() &&
                IERC165(sender).supportsInterface(
                    type(IEntryPoint).interfaceId
                ),
            ISmartAccountFactory.EntryPointInterfaceMismatch(sender)
        );

        return _createAccount(owner, salt);
    }

    /**
     * @notice Declares supported interfaces for ERC-165 discovery.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override(ERC165Internal, ProxyFactoryInternal)
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(ISmartAccountFactory).interfaceId;
    }
}
