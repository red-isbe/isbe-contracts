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

interface ISmartAccountFactory {
    /**
     * @notice Thrown when the provided address does not implement the required {IEntryPoint} interface.
     * @dev Should be raised during initialisation or update if the ERC-165
     *      interface check for {IEntryPoint} fails.
     * @param entryPoint The non-conforming EntryPoint contract address.
     */
    error EntryPointInterfaceMismatch(address entryPoint);

    /**
     * @notice Deploys a SmartAccount.
     * @param owner The owner of the to-be-deployed SmartAccount.
     * @param salt The salt to be used when deploying the account.
     */
    function createAccount(
        address owner,
        bytes32 salt
    ) external returns (address);
}
