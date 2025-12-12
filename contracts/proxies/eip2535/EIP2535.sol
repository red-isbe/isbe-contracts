// SPDX-License-Identifier: Apache-2.0

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
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {FacetAddressResolver} from './FacetAddressResolver.sol';

abstract contract EIP2535 is FacetAddressResolver {
    /**
     * @notice Allows the contract to accept native currency (e.g., Ether) payments.
     * @dev This function is executed when the contract receives plain Ether with no data.
     *      It does not perform any operations besides receiving Ether.
     */
    receive() external payable {}

    // solhint-disable-next-line no-complex-fallback
    fallback() external payable {
        // Get facet from function selector
        address facet = _resolveFacetAddress(_msgSig());

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

    function _resolveFacetAddress(
        bytes4 _sig
    ) private view returns (address facet_) {
        facet_ = _facetAddress(_sig);
        require(facet_ != address(0), FunctionNotFound(_sig));
    }
}
