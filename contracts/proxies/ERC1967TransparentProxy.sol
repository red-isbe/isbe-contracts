// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {_EIP1967_PROXY_ADMIN} from '../constants/storagePositions.sol';
import './ERC1967Proxy.sol';

abstract contract ERC1967TransparentProxy is ERC1967Proxy {
    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);

    modifier ifAdmin() {
        if (msg.sender == _getAdmin()) {
            _;
        } else {
            _fallback();
        }
    }

    receive() external payable virtual override {
        _fallback();
    }

    fallback() external payable virtual override {
        _fallback();
    }

    function _fallback() internal virtual {
        require(msg.sender != _getAdmin(), 'Admin cannot fallback');
        _delegate(_getImplementation());
    }

    function _setAdmin(address newAdmin) internal {
        require(newAdmin != address(0), 'Invalid admin address');
        emit AdminChanged(_getAdmin(), newAdmin);
        assembly {
            sstore(_EIP1967_PROXY_ADMIN, newAdmin)
        }
    }

    function _getAdmin() internal view returns (address admin) {
        assembly {
            admin := sload(_EIP1967_PROXY_ADMIN)
        }
    }

    function _changeAdmin(address newAdmin) internal {
        _setAdmin(newAdmin);
    }
}
