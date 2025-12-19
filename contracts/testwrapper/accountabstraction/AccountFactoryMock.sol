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

contract AccountFactoryMock {
    error FactoryForcedRevert();

    function createAccountOtherAddress() external view returns (address) {
        return address(this);
    }

    function createAccountRevert() external pure returns (address) {
        revert FactoryForcedRevert();
    }

    function createAccountEOA(address owner) external pure returns (address) {
        return owner;
    }
}
