// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

abstract contract ERC165 is IERC165 {
    function supportsInterface(
        bytes4 interfaceId
    ) external pure returns (bool) {
        return
            _supportsERC165Interface(interfaceId) ||
            _supportsInterface(interfaceId, _implementedInterfaces());
    }

    function _supportsERC165Interface(
        bytes4 interfaceId
    ) internal pure virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }

    function _supportsInterface(
        bytes4 interfaceId,
        bytes4[] memory _interfaces
    ) internal pure virtual returns (bool) {
        for (uint256 i = 0; i < _interfaces.length; i++) {
            if (_interfaces[i] == interfaceId) {
                return true;
            }
        }
        return false;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        returns (bytes4[] memory interfaces_);

    function _aggregateInterfaces(
        bytes4[][] memory interfacesArrays,
        bytes4[] memory interfaces
    ) internal pure returns (bytes4[] memory interfaces_) {
        uint256 interfacesLength = interfaces.length;

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

        for (uint256 k = 0; k < interfaces.length; k++) {
            interfaces_[index++] = interfaces[k];
        }
    }
}
