// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';

abstract contract ERC165Common {
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
}
