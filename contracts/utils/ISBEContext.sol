// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import {Context} from '@openzeppelin/contracts/utils/Context.sol';

abstract contract ISBEContext is Context {
    /**
     * @dev Emitted when the provided `addr` is 0
     *
     * @param addr The address to check
     */
    error AddressZero(address addr);

    function _blockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    function _msgSig() internal view virtual returns (bytes4) {
        return msg.sig;
    }

    /**
     * @dev Checks if an address equals to zero address
     *
     * @param addr The address to check
     */
    function _addressIsNotZero(address addr) internal pure {
        require(addr != address(0), AddressZero(addr));
    }
}
