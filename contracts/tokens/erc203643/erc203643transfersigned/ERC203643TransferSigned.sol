// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../ERC203643InternalCommon.sol';
import {_SPONSOR_ROLE} from '../../../constants/roles.sol';
import {_ERC203643_TRANSFER_SIGNED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IERC203643TransferSigned} from './IERC203643TransferSigned.sol';
import {ERC712Internal} from '../../../core/ERC712Internal.sol';
import {
    _CONTRACT_NAME_ERC203643,
    _CONTRACT_VERSION_ERC203643
} from '../../../constants/values.sol';
import {
    _getMessageHashTransfer,
    _getMessageHashTransferFrom
} from '../../../core/signatureVerification.sol';

/**
 * @title ERC203643 Transfer Signed
 * @notice Abstract contract implementing signed transfer functionality for ERC203643 tokens
 * @dev Extends ERC203643InternalCommon and ERC721Internal to provide signature-based transfer mechanisms.
 *      Requires _SPONSOR_ROLE for external function access. Integrates with signature verification utilities.
 * @author [Author or team]
 */
abstract contract ERC203643TransferSigned is
    IERC203643TransferSigned,
    ERC203643InternalCommon,
    ERC712Internal
{
    constructor() {
        _disableInitializers(_ERC203643_TRANSFER_SIGNED_RESOLVER_KEY);
    }

    /**
     * @notice Transfers tokens based on a signed message from the sender
     * @dev Verifies the signature using EIP-712 typed data before executing the transfer.
     *      Only callable when not paused and by accounts with _SPONSOR_ROLE.
     *      Emits a WithSignatureTransferred event upon successful transfer.
     * @param _to The address to transfer tokens to
     * @param _amount The amount of tokens to transfer
     * @param _sender The address of the token sender (signer)
     * @param _deadline Unix timestamp after which the signature is invalid
     * @param _nonce Unique number to prevent replay attacks
     * @param _signature Signature of the transaction data
     */
    function transferWithSignature(
        address _to,
        uint256 _amount,
        address _sender,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external override whenNotPaused onlyRole(_SPONSOR_ROLE) {
        _checkSignedTransaction(
            _sender,
            _deadline,
            _nonce,
            _getMessageHashTransfer(_to, _amount, _sender, _deadline, _nonce),
            _signature,
            _CONTRACT_NAME_ERC203643,
            _CONTRACT_VERSION_ERC203643,
            _blockChainId()
        );
        _transfer(_sender, _to, _amount);
        emit WithSignatureTransferred(
            _sender,
            _to,
            _amount,
            _sender,
            _deadline,
            _nonce,
            _signature
        );
    }

    /**
     * @notice Transfers tokens from one address to another based on a signed message
     * @dev Verifies the signature using EIP-712 typed data, spends the sender's allowance,
     *      then executes the transfer. Only callable when not paused and by accounts with _SPONSOR_ROLE.
     *      Emits a WithSignatureTransferred event upon successful transfer.
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _amount The amount of tokens to transfer
     * @param _sender The address of the transaction sponsor (signer)
     * @param _deadline Unix timestamp after which the signature is invalid
     * @param _nonce Unique number to prevent replay attacks
     * @param _signature Signature of the transaction data
     */
    function transferFromWithSignature(
        address _from,
        address _to,
        uint256 _amount,
        address _sender,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external override whenNotPaused onlyRole(_SPONSOR_ROLE) {
        _checkSignedTransaction(
            _sender,
            _deadline,
            _nonce,
            _getMessageHashTransferFrom(
                _from,
                _to,
                _amount,
                _sender,
                _deadline,
                _nonce
            ),
            _signature,
            _CONTRACT_NAME_ERC203643,
            _CONTRACT_VERSION_ERC203643,
            _blockChainId()
        );
        _spendAllowance(_from, _sender, _amount);
        _transfer(_from, _to, _amount);
        emit WithSignatureTransferred(
            _from,
            _to,
            _amount,
            _sender,
            _deadline,
            _nonce,
            _signature
        );
    }

    /**
     * @notice Returns the list of interfaces implemented by this contract
     * @dev Overrides the base implementation to specify IERC203643TransferSigned interface support
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
        interfaces_[--interfacesLength] = type(IERC203643TransferSigned)
            .interfaceId;
    }
}
