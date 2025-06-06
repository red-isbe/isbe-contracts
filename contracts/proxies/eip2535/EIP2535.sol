// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EIP2535Internal} from './EIP2535Internal.sol';

/**
 * @title EIP2535 Abstract Contract
 * @dev Implements the base logic for handling function calls in a diamond contract as defined by the
 *      EIP-2535 Diamond Standard. This abstract contract provides a fallback mechanism to forward calls
 *      to the appropriate facet and handles cases where no function is found. It inherits internal
 *      utility functions from `EIP2535Internal`.
 */
abstract contract EIP2535 is EIP2535Internal {
    /**
     * @dev Error thrown when a function selector does not map to any facet.
     * @param _functionSelector The function selector that was called and could not be resolved to any facet.
     */
    error FunctionNotFound(bytes4 _functionSelector);

    /**
     * @notice Allows the contract to accept native currency (e.g., Ether) payments.
     * @dev This function is executed when the contract receives plain Ether with no data.
     *      It does not perform any operations besides receiving Ether.
     */
    receive() external payable {}

    /**
     * @notice Forwards function calls to the appropriate facet based on the function selector.
     * @dev If a function selector cannot be resolved to a facet, the `FunctionNotFound` error is thrown. This
     *      fallback function uses inline assembly to:
     *      - Retrieve the function selector from the calldata.
     *      - Identify the facet address associated with the function selector via `_facetAddress`.
     *      - Execute the resolved function using `delegatecall`.
     *      - Return any return data or error back to the caller.
     * @dev This function is executed when no other function matches the function signature of the call.
     * @dev **Note**: `solhint-disable-next-line no-complex-fallback` is used to disable Solidity linter warnings
     *      for complex fallback logic.
     */
    // solhint-disable-next-line no-complex-fallback
    fallback() external payable {
        bytes4 sig = _msgSig();
        // Get facet from function selector
        address facet = _facetAddress(sig);
        if (facet == address(0)) {
            revert FunctionNotFound(sig);
        }

        // Execute external function from facet using delegatecall and return any value
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // Execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // Get any return value
            returndatacopy(0, 0, returndatasize())
            // Return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
