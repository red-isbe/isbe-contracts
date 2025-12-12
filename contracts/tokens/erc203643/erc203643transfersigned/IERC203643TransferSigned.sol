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

/**
 * @title ERC203643 Transfer Signed Interface
 * @notice Defines the interface for transferring tokens with cryptographic signatures
 * @dev Provides methods for signed transfers to enable off-chain approvals and decentralised transactions
 */
interface IERC203643TransferSigned {
    /**
     * @notice Event emitted when a transfer is executed using a signature
     * @param from Address initiating the transfer (indexed)
     * @param to Recipient address (indexed)
     * @param amount Amount of tokens transferred
     * @param sender Original signer of the transaction (indexed)
     * @param deadline Timestamp after which the signature is invalid
     * @param nonce Unique identifier for this specific transfer operation
     * @param signature Cryptographic signature authorising the transfer
     */
    event WithSignatureTransferred(
        address indexed from,
        address indexed to,
        uint256 amount,
        address indexed sender,
        uint256 deadline,
        uint256 nonce,
        bytes signature
    );

    /**
     * @notice Transfers tokens using a cryptographic signature instead of approvals
     * @dev Allows off-chain signing for decentralised transfers without prior allowance
     * @param _to Recipient address
     * @param _amount Amount to transfer
     * @param _sender Original signer who authorised the transaction
     * @param _deadline Timestamp after which signature becomes invalid
     * @param _nonce Unique identifier for this specific transfer operation
     * @param _signature Cryptographic signature authorising the transfer
     */
    function transferWithSignature(
        address _to,
        uint256 _amount,
        address _sender,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external;

    /**
     * @notice Transfers tokens from one account to another using a signature (pull payment)
     * @dev Allows off-chain signing for decentralised transfers without prior allowance
     *      Similar to transferWithSignature but with explicit sender specification
     * @param _from Account from which tokens are transferred
     * @param _to Recipient address
     * @param _amount Amount to transfer
     * @param _sender Original signer who authorised the transaction
     * @param _deadline Timestamp after which signature becomes invalid
     * @param _nonce Unique identifier for this specific transfer operation
     * @param _signature Cryptographic signature authorising the transfer
     */
    function transferFromWithSignature(
        address _from,
        address _to,
        uint256 _amount,
        address _sender,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external;
}
