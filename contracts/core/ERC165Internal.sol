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
    ) internal pure virtual returns (bool) {
        for (uint256 i = 0; i < _interfaces.length; i++) {
            if (_interfaces[i] == _interfaceId) {
                return true;
            }
        }
        return false;
    }

    function _aggregateInterfaces(
        bytes4[][] memory interfacesArrays,
        bytes4[] memory _interfaces
    ) internal pure returns (bytes4[] memory interfaces_) {
        uint256 interfacesLength = _interfaces.length;

        for (uint256 i = 0; i < interfacesArrays.length; i++) {
            interfacesLength += interfacesArrays[i].length;
        }

        interfaces_ = new bytes4[](interfacesLength);

        uint256 index = 0;

        for (uint256 i = 0; i < interfacesArrays.length; i++) {
            bytes4[] memory subArray = interfacesArrays[i];
            for (uint256 j = 0; j < subArray.length; j++) {
                interfaces_[index++] = subArray[j];
            }
        }

        for (uint256 k = 0; k < _interfaces.length; k++) {
            interfaces_[index++] = _interfaces[k];
        }
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_);
}
