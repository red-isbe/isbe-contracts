// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {ERC1967TransparentProxy} from './ERC1967TransparentProxy.sol';
contract TransparentProxy is ERC1967TransparentProxy {
    constructor(address implementation_, address admin_) {
        _setImplementation(implementation_);
        _setAdmin(admin_);
    }

    function upgradeTo(address newImplementation) external ifAdmin {
        _setImplementation(newImplementation);
    }

    function upgradeToAndCall(
        address newImplementation,
        bytes calldata data
    ) external payable ifAdmin {
        _setImplementation(newImplementation);
        if (data.length > 0) {
            (bool success, ) = newImplementation.delegatecall(data);
            require(success, 'Initialization failed');
        }
    }

    function changeAdmin(address newAdmin) external ifAdmin {
        _changeAdmin(newAdmin);
    }

    function admin() external ifAdmin returns (address) {
        return _getAdmin();
    }

    function implementation() external ifAdmin returns (address) {
        return _getImplementation();
    }
}
