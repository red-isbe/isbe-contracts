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

/* solhint-disable no-inline-assembly */

/**
 * @title EntryPoint memory utilities
 * @notice Provides low-level memory helpers used by the EntryPoint.
 * @dev Wraps common free memory pointer and revert-code handling patterns
 *      in reusable internal functions to keep assembly usage localised and
 *      explicit.
 * @author ISBE Development Team
 */
abstract contract EntryPointMemoryUtils {
    /**
     * @notice Returns the current free memory pointer.
     * @dev Reads the Solidity free memory pointer at slot 0x40. Intended to be
     *      paired with {_restoreFreePtr} to preserve the memory allocator
     *      state across temporary manual allocations.
     * @return ptr Current value of the free memory pointer.
     */
    function _getFreePtr() internal pure returns (uint256 ptr) {
        assembly ('memory-safe') {
            ptr := mload(0x40)
        }
    }

    /**
     * @notice Restores the free memory pointer to a previous value.
     * @dev Writes the provided pointer back into slot 0x40. Call this after
     *      using temporary scratch memory to avoid leaking memory and to keep
     *      gas usage predictable when performing manual allocations.
     * @param ptr Previously saved free memory pointer to restore.
     */
    function _restoreFreePtr(uint256 ptr) internal pure {
        assembly ('memory-safe') {
            mstore(0x40, ptr)
        }
    }

    /**
     * @notice Extracts a 32-byte revert code from returndata when present.
     * @dev If the current returndata is exactly 32 bytes long, this function
     *      copies it to memory and returns it as a bytes32 value. Otherwise it
     *      returns zero. Intended for AA-style error code handling where a
     *      fixed-size error word is used.
     * @return revertCode Raw 32-byte revert code extracted from returndata, or
     *         zero if the size does not match 32 bytes.
     */
    function _getRevertCode() internal pure returns (bytes32 revertCode) {
        assembly ('memory-safe') {
            if eq(returndatasize(), 32) {
                returndatacopy(0, 0, 32)
                revertCode := mload(0)
            }
        }
    }
}
