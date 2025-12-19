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

import '../../../factory/proxyfactory/ProxyFactoryInternal.sol';
import '../SmartAccount.sol';
import '../../entrypoint/IEntryPoint.sol';
import {ERC165Checker} from '@openzeppelin/contracts/utils/introspection/ERC165Checker.sol';
import {
    _OWNABLE_RESOLVER_KEY,
    _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY
} from '../../../constants/resolverKeys.sol';
import {DidDocumentDetailedInternal} from '../../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {
    _SMART_ACCOUNT_CONFIGURATION_ID,
    _SMART_ACCOUNT_VERSION
} from '../../../constants/values.sol';
import {OwnableBase} from '../../../access/ownable/Ownable.sol';

/**
 * @title Smart Account Factory internals
 * @notice Provides core internal functionality for deploying ERC-4337 smart accounts.
 * @author ISBE Development Team
 */
abstract contract SmartAccountFactoryInternal is
    DidDocumentDetailedInternal,
    ProxyFactoryInternal
{
    using ERC165Checker for address;

    /**
     * @notice Deploys a SmartAccount.
     * @param owner The owner of the to-be-deployed SmartAccount.
     */
    function _createAccount(
        address owner,
        bytes32 salt
    ) internal returns (address) {
        bytes32[] memory initBusinessIds = _buildInitBusinessIds();
        bytes[] memory initData = _buildInitData(owner);

        address computedAddress = _computeAddress(
            _SMART_ACCOUNT_CONFIGURATION_ID,
            _SMART_ACCOUNT_VERSION,
            initBusinessIds,
            initData,
            new IAccessControlEoa.Rbac[](0),
            false,
            salt
        );

        if (computedAddress.code.length != 0) {
            return computedAddress;
        }

        return
            _deployUseCase(
                _SMART_ACCOUNT_CONFIGURATION_ID,
                _SMART_ACCOUNT_VERSION,
                new IAccessControlEoa.Rbac[](0),
                false,
                initBusinessIds,
                initData,
                true,
                salt
            );
    }

    function _buildInitData(
        address owner
    ) private view returns (bytes[] memory) {
        bytes[] memory initData = new bytes[](2);

        initData[0] = abi.encodeWithSelector(
            OwnableBase.initializeOwnable.selector,
            owner
        );
        initData[1] = abi.encodeWithSelector(
            SmartAccount.initializeSmartAccount.selector,
            IEntryPoint(_msgSender())
        );

        return initData;
    }

    function _buildInitBusinessIds() private pure returns (bytes32[] memory) {
        bytes32[] memory initBusinessIds = new bytes32[](2);
        initBusinessIds[0] = _OWNABLE_RESOLVER_KEY;
        initBusinessIds[1] = _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY;
        return initBusinessIds;
    }
}
