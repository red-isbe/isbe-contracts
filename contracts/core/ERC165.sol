// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {ERC165Internal} from './ERC165Internal.sol';

/**
 * @title ERC165
 * @author ISBE
 * @notice Implements the ERC-165 standard for interface detection.
 * @dev This abstract contract provides a standardised way to check if a smart contract
 * implements a given interface. It combines the `IERC165` interface with the internal
 * logic from `ERC165Internal` to deliver a complete implementation. The `supportsInterface`
 * function is the primary entry point, allowing external contracts and applications to
 * query the supported interfaces of a contract.
 */
abstract contract ERC165 is IERC165, ERC165Internal {
    function supportsInterface(
        bytes4 _interfaceId
    ) external pure returns (bool) {
        return
            _isERC165ForbiddenInterfaces(_interfaceId)
                ? (_supportsERC165Interface(_interfaceId) ||
                    _supportsInterface(_interfaceId, _implementedInterfaces()))
                : false;
    }
}
