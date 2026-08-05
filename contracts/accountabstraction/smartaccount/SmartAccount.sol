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

import {
    PackedUserOperation
} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {
    IERC1155Receiver
} from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import {IERC721Receiver} from '../../tokens/erc721/IERC721Receiver.sol';
import {ISmartAccount} from './ISmartAccount.sol';
import {IEntryPoint} from '../entrypoint/IEntryPoint.sol';
import {SmartAccountInternal} from './SmartAccountInternal.sol';
import {
    _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {
    _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_VERSION
} from '../../constants/facetVersions.sol';
import {ERC165} from '../../core/ERC165.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../constants/roles.sol';

/**
 * @title SmartAccount Internal Implementation
 * @notice Concrete-facing layer that wires external ISmartAccount calls to internal
 *         validation logic for an ERC-4337 smart account.
 * @dev Delegates core logic to SmartAccountInternal and exposes EntryPoint callbacks.
 *      Access control and initialisation are expected from inherited mixins.
 *      Uses unstructured storage to remain layout-agnostic across upgrades.
 * @author ISBE Development Team
 */
abstract contract SmartAccount is
    ISmartAccount,
    SmartAccountInternal,
    IERC721Receiver,
    IERC1155Receiver,
    ERC165
{
    /**
     * @notice Restricts execution to calls originating from the EntryPoint.
     * @dev Reverts when unauthorised.
     */
    modifier requireFromEntryPoint() {
        _requireFromEntryPoint();
        _;
    }

    /**
     * @notice Restricts execution to calls from EntryPoint or the account owner.
     * @dev Reverts when unauthorised.
     */
    modifier requireFromEntryPointOrOwner() {
        _requireFromEntryPointOrOwner();
        _;
    }

    receive() external payable {}

    function updateEntryPoint(
        IEntryPoint entryPoint
    )
        external
        onlyRole(_DEFAULT_ADMIN_ROLE)
        addressIsNotZero(address(entryPoint))
    {
        _setEntryPoint(entryPoint);
        emit EntryPointUpdated(address(entryPoint));
    }

    /**
     * @notice Initialises the smart account with an EntryPoint reference.
     * @dev Verifies ERC-165 support on the given EntryPoint. Protected by
     *      {initializer} and {addressIsNotZero}. Emits {SmartAccountInitialized}.
     * @param entryPoint The EntryPoint contract used for validation.
     */
    function initializeSmartAccount(
        IEntryPoint entryPoint
    )
        external
        onlyRole(_DEFAULT_ADMIN_ROLE)
        addressIsNotZero(address(entryPoint))
        initializer(
            _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY,
            _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_VERSION
        )
    {
        _initializeSmartAccount(entryPoint);
        emit SmartAccountInitialized(address(entryPoint));
    }

    /// @inheritdoc ISmartAccount
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override whenNotPaused requireFromEntryPoint returns (uint256) {
        return _validateUserOp(userOp, userOpHash, missingAccountFunds);
    }

    /// @inheritdoc ISmartAccount
    function execute(
        address dest,
        uint256 value,
        bytes calldata functionData
    ) external override whenNotPaused requireFromEntryPointOrOwner {
        _execute(dest, value, functionData);
    }

    /// @inheritdoc IERC721Receiver
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @inheritdoc IERC1155Receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    /// @inheritdoc IERC1155Receiver
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    /**
     * @notice Declares supported interfaces for ERC-165 discovery.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](3);
        interfaces_[0] = type(ISmartAccount).interfaceId;
        interfaces_[1] = type(IERC721Receiver).interfaceId;
        interfaces_[2] = type(IERC1155Receiver).interfaceId;
    }
}
