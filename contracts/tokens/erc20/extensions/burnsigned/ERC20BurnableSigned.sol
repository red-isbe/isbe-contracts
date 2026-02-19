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

import {ERC712Internal} from '../../../../core/ERC712Internal.sol';
import {
    ERC203643InternalCommon
} from '../../../erc203643/ERC203643InternalCommon.sol';
import {
    _CONTRACT_NAME_ERC203643,
    _CONTRACT_VERSION_ERC203643
} from '../../../../constants/values.sol';
import {
    _getMessageHashBurn,
    _getMessageHashBurnFrom
} from '../../../../core/signatureVerification.sol';
import {IERC20BurnableSigned} from './IERC20BurnableSigned.sol';
import {
    _ERC20_BURNABLE_SIGNED_RESOLVER_KEY
} from '../../../../constants/resolverKeys.sol';
import {_SPONSOR_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC203643 Burnable Signed
 * @notice Abstract contract implementing signed burn functionality for ERC203643 tokens
 * @dev Extends ERC203643InternalCommon and ERC721Internal to provide signature-based burn mechanisms.
 *      Requires _SPONSOR_ROLE for external function access. Integrates with signature verification utilities.
 * @author [Author or team]
 */
abstract contract ERC20BurnableSigned is
    IERC20BurnableSigned,
    ERC203643InternalCommon,
    ERC712Internal
{
    constructor() {
        _disableInitializers(_ERC20_BURNABLE_SIGNED_RESOLVER_KEY);
    }

    /**
     * @notice Burns tokens from the caller's account based on a signed message
     * @dev Verifies the signature using EIP-712 typed data before executing the burn.
     *      Only callable when not paused and by accounts with _SPONSOR_ROLE.
     *      Emits a WithSignatureBurned event upon successful burn.
     * @param _account The address whose tokens are being burned
     * @param _amount The amount of tokens to burn
     * @param _deadline Unix timestamp after which the signature is invalid
     * @param _nonce Unique number to prevent replay attacks
     * @param _signature Signature of the transaction data
     */
    function burnWithSignature(
        address _account,
        uint256 _amount,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external override whenNotPaused onlyRole(_SPONSOR_ROLE) {
        _checkSignedTransaction(
            _account,
            _deadline,
            _nonce,
            _getMessageHashBurn(_account, _amount, _deadline, _nonce),
            _signature,
            _CONTRACT_NAME_ERC203643,
            _CONTRACT_VERSION_ERC203643,
            _blockChainId()
        );
        _burn(_account, _amount);
        emit WithSignatureBurned(
            _account,
            _amount,
            _deadline,
            _nonce,
            _signature
        );
    }

    /**
     * @notice Burns tokens from a specific account using a signed message (pull payment)
     * @dev Verifies the signature using EIP-712 typed data, spends the sender's allowance,
     *      then executes the burn. Only callable when not paused and by accounts with _SPONSOR_ROLE.
     *      Emits a WithSignatureBurnedFrom event upon successful burn.
     * @param _sender The address of the transaction sponsor (signer)
     * @param _account The address whose tokens are being burned
     * @param _amount The amount of tokens to burn
     * @param _deadline Unix timestamp after which the signature is invalid
     * @param _nonce Unique number to prevent replay attacks
     * @param _signature Signature of the transaction data
     */
    function burnFromWithSignature(
        address _sender,
        address _account,
        uint256 _amount,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external override whenNotPaused onlyRole(_SPONSOR_ROLE) {
        _checkSignedTransaction(
            _sender,
            _deadline,
            _nonce,
            _getMessageHashBurnFrom(
                _sender,
                _account,
                _amount,
                _deadline,
                _nonce
            ),
            _signature,
            _CONTRACT_NAME_ERC203643,
            _CONTRACT_VERSION_ERC203643,
            _blockChainId()
        );
        _spendAllowance(_account, _sender, _amount);
        _burn(_account, _amount);
        emit WithSignatureBurnedFrom(
            _sender,
            _account,
            _amount,
            _deadline,
            _nonce,
            _signature
        );
    }

    /**
     * @notice Returns the list of interfaces implemented by this contract
     * @dev Overrides the base implementation to specify IERC20BurnableSigned interface support
     * @return interfaces_ Array of interface identifiers supported by this contract
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20BurnableSigned)
            .interfaceId;
    }
}
