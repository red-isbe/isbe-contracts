// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

abstract contract ERC165Internal {
    function _checkERC165ForbiddenInterfaces(
        bytes4 _interfaceId
    ) internal pure virtual returns (bool) {
        if (_interfaceId == 0xffffffff) {
            return false; // 0xffffffff is not a valid interface ID
        }
        return true;
    }

    function _supportsERC165Interface(
        bytes4 _interfaceId
    ) internal pure virtual returns (bool) {
        return _interfaceId == type(IERC165).interfaceId;
    }

    function _supportsInterface(
        bytes4 _interfaceId,
        bytes4[] memory _interfaces
    ) internal pure virtual returns (bool supported) {
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
        bytes4[][] memory interfacesArrays,
        bytes4[] memory _interfaces
    ) internal pure returns (bytes4[] memory interfaces_) {
        uint256 inputLength = interfacesArrays.length;
        uint256 outputLength = _interfaces.length;

        for (uint256 index; index < inputLength; ) {
            unchecked {
                outputLength += interfacesArrays[index].length;
                ++index;
            }
        }

        interfaces_ = new bytes4[](outputLength);

        uint256 outputIndex;
        uint256 innerLength;
        uint256 subArrayIndex;
        for (uint256 inputIndex; inputIndex < inputLength; ) {
            bytes4[] memory subArray = interfacesArrays[inputIndex];
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
