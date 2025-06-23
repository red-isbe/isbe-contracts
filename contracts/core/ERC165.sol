// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {ERC165Internal} from './ERC165Internal.sol';

abstract contract ERC165 is IERC165, ERC165Internal {
    function supportsInterface(
        bytes4 _interfaceId
    ) external pure returns (bool) {
        if (!_checkERC165ForbiddenInterfaces(_interfaceId)) {
            return false;
        }
        return
            _supportsERC165Interface(_interfaceId) ||
            _supportsInterface(_interfaceId, _implementedInterfaces());
    }
}
