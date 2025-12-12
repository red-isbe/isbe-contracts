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
 * @title ERC203643 Capped Signed Interface
 * @notice Defines the interface for minting capped tokens with cryptographic signatures
 * @dev Provides methods for signed minting to enable off-chain approvals and decentralised minting within cap limits
 */
interface IERC203643CappedSigned {
    /**
     * @notice Event emitted when tokens are minted using a signature
     * @param to Recipient address (indexed)
     * @param amount Amount of tokens minted
     * @param sender Original signer who authorised the minting (indexed)
     * @param deadline Timestamp after which the signature is invalid
     * @param nonce Unique identifier for this specific minting operation
     * @param signature Cryptographic signature authorising the minting
     */
    event WithSignatureMinted(
        address indexed to,
        uint256 amount,
        address indexed sender,
        uint256 deadline,
        uint256 nonce,
        bytes signature
    );

    /**
     * @notice Mints new tokens using a cryptographic signature instead of direct access control
     * @dev Allows off-chain signing for decentralised minting without direct role requirements
     * @param _to Recipient address
     * @param _amount Amount to mint
     * @param _sender Original signer who authorised the minting
     * @param _deadline Timestamp after which signature becomes invalid
     * @param _nonce Unique identifier for this specific minting operation
     * @param _signature Cryptographic signature authorising the minting
     */
    function mintWithSignature(
        address _to,
        uint256 _amount,
        address _sender,
        uint256 _deadline,
        uint256 _nonce,
        bytes calldata _signature
    ) external;
}
