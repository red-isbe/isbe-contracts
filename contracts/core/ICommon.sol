// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICommon {
    /**
     * @dev Emitted when the provided `addr` is 0
     *
     * @param addr The address to check
     */
    error AddressZero(address addr);
}
