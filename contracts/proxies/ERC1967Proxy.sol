// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_EIP1967_PROXY_IMPLEMENTATION} from '../constants/storagePositions.sol';

abstract contract ERC1967Proxy {
    receive() external payable virtual {
        _delegate(_getImplementation());
    }

    fallback() external payable virtual {
        _delegate(_getImplementation());
    }

    function _delegate(address implementation) internal virtual {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    function _setImplementation(address newImplementation) internal {
        require(newImplementation.code.length > 0, 'Invalid implementation');
        assembly {
            sstore(_EIP1967_PROXY_IMPLEMENTATION, newImplementation)
        }
    }

    function _getImplementation() internal view returns (address impl) {
        assembly {
            impl := sload(_EIP1967_PROXY_IMPLEMENTATION)
        }
    }
}
