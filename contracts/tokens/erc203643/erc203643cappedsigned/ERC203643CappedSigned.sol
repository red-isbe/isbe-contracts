// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../ERC203643InternalCommon.sol';
import {_SPONSOR_ROLE, _MINTER_ROLE} from '../../../constants/roles.sol';
import {_ERC203543_CAPPED_SIGNED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {IERC203643CappedSigned} from './IERC203643CappedSigned.sol';
import {ERC712Internal} from '../../../core/ERC712Internal.sol';
import {
    _CONTRACT_NAME_ERC203643,
    _CONTRACT_VERSION_ERC203643
} from '../../../constants/values.sol';
import {_getMessageHashMint} from '../../../core/signatureVerification.sol';

/**
 * @title ERC203543 Capped Signed
 * @notice Abstract contract implementing signed minting functionality for ERC203543 capped tokens
 * @dev Extends ERC203643InternalCommon and ERC721Internal to provide signature-based minting mechanisms.
 *      Requires _SPONSOR_ROLE for external function access. Integrates with signature verification utilities.
 *      Enforces cap limits on total supply.
 * @author [Author or team]
 */
abstract contract ERC203643CappedSigned is
    IERC203643CappedSigned,
    ERC203643InternalCommon,
    ERC712Internal
{
    constructor() {
        _disableInitializers(_ERC203543_CAPPED_SIGNED_RESOLVER_KEY);
    }

    /**
     * @notice Mints new tokens based on a signed message
     * @dev Verifies the signature using EIP-712 typed data before executing the mint.
     *      Only callable when not paused and by accounts with _SPONSOR_ROLE.
     *      Enforces cap limits on total supply.
     *      Emits a WithSignatureMinted event upon successful minting.
     * @param _to The address to mint tokens to
     * @param _amount The amount of tokens to mint
     * @param _sender The address of the token minter (signer)
     * @param _deadline Unix timestamp after which the signature is invalid
     * @param _nonce Unique number to prevent replay attacks
     * @param _signature Signature of the minting data
     */
    function mintWithSignature(
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
            _getMessageHashMint(_to, _amount, _sender, _deadline, _nonce),
            _signature,
            _CONTRACT_NAME_ERC203643,
            _CONTRACT_VERSION_ERC203643,
            _blockChainId()
        );
        _checkRole(_MINTER_ROLE, _sender);
        _mint(_to, _amount);
        emit WithSignatureMinted(
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
     * @dev Overrides the base implementation to specify IERC203543CappedSigned interface support
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
        interfaces_[--interfacesLength] = type(IERC203643CappedSigned)
            .interfaceId;
    }
}
