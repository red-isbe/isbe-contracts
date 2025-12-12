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

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

/**
 * @title ERC165 Internal Logic
 * @author ISBE
 * @notice Provides the core internal functions for the ERC-165 interface detection standard.
 * @dev This abstract contract supplies the foundational logic for ERC-165. It offers internal
 * helper functions to validate interface IDs, check for support of a specific interface
 * within an array, and aggregate multiple interface lists. Contracts inheriting from this must
 * implement the `_implementedInterfaces` function to declare which interfaces they support,
 * enabling standardised interface detection.
 */
abstract contract ERC165Internal {
    function _isERC165ForbiddenInterfaces(
        bytes4 _interfaceId
    ) internal pure virtual returns (bool) {
        return _interfaceId == 0xffffffff;
    }

    function _supportsERC165Interface(
        bytes4 _interfaceId
    ) internal pure virtual returns (bool) {
        return _interfaceId == type(IERC165).interfaceId;
    }

    function _supportsInterface(
        bytes4 _interfaceId,
        bytes4[] memory _interfaces
    ) internal pure virtual returns (bool supported_) {
        uint256 length = _interfaces.length;
        for (uint256 index; index < length; ) {
            if (_interfaces[index] == _interfaceId) {
                return true;
            }
            unchecked {
                ++index;
            }
        }
    }

    function _aggregateInterfaces(
        bytes4[][] memory _interfacesArrays,
        bytes4[] memory _interfaces
    ) internal pure returns (bytes4[] memory interfaces_) {
        uint256 inputLength = _interfacesArrays.length;
        uint256 outputLength = _interfaces.length;

        for (uint256 index; index < inputLength; ) {
            unchecked {
                outputLength += _interfacesArrays[index].length;
                ++index;
            }
        }

        interfaces_ = new bytes4[](outputLength);

        uint256 outputIndex;
        uint256 innerLength;
        uint256 subArrayIndex;
        for (uint256 inputIndex; inputIndex < inputLength; ) {
            bytes4[] memory subArray = _interfacesArrays[inputIndex];
            innerLength = subArray.length;
            for (; subArrayIndex < innerLength; ) {
                interfaces_[outputIndex] = subArray[subArrayIndex];
                unchecked {
                    ++subArrayIndex;
                    ++outputIndex;
                }
            }
            subArrayIndex = 0;
            unchecked {
                ++inputIndex;
            }
        }

        uint256 inputInterfacesLength = _interfaces.length;
        for (uint256 inputIndex; inputIndex < inputInterfacesLength; ) {
            interfaces_[outputIndex] = _interfaces[inputIndex];
            unchecked {
                ++inputIndex;
                ++outputIndex;
            }
        }
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_);
}
