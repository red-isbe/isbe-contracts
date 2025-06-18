// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ERC20_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {
    ERC20Capped
} from '../../../tokens/erc20/extensions/cap/ERC20Capped.sol';
import {
    ERC20Burnable
} from '../../../tokens/erc20/extensions/burn/ERC20Burnable.sol';
import {
    ERC20Controller
} from '../../../tokens/erc20/extensions/controller/ERC20Controller.sol';
import {
    ERC20Snapshot
} from '../../../tokens/erc20/extensions/snapshot/ERC20Snapshot.sol';
import {ERC20} from '../../../tokens/erc20/ERC20.sol';
import {
    IEIP2535Introspection
} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

// solhint-disable-next-line
contract ERC20TestWrapper is
    ERC20,
    ERC20Burnable,
    ERC20Capped,
    ERC20Snapshot,
    ERC20Controller,
    IEIP2535Introspection
{
    function supportsInterface(
        bytes4 interfaceId
    )
        external
        pure
        override(
            ERC20,
            ERC20Burnable,
            ERC20Capped,
            ERC20Snapshot,
            ERC20Controller
        )
        returns (bool)
    {
        return
            _supportsERC165Interface(interfaceId) ||
            _supportsInterface(interfaceId, _erc20Interfaces()) ||
            _supportsInterface(interfaceId, _erc20BurnableInterfaces()) ||
            _supportsInterface(interfaceId, _erc20CappedInterfaces()) ||
            _supportsInterface(interfaceId, _erc20SnapshotInterfaces()) ||
            _supportsInterface(interfaceId, _erc20ControllerInterfaces());
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = _erc20Interfaces().length +
            _erc20BurnableInterfaces().length +
            _erc20CappedInterfaces().length +
            _erc20ControllerInterfaces().length +
            _erc20SnapshotInterfaces().length;

        interfaces_ = new bytes4[](interfacesLength);

        uint256 index = 0;

        for (uint256 i = 0; i < _erc20Interfaces().length; i++) {
            interfaces_[index] = _erc20Interfaces()[i];
            index++;
        }

        for (uint256 i = 0; i < _erc20BurnableInterfaces().length; i++) {
            interfaces_[index] = _erc20BurnableInterfaces()[i];
            index++;
        }

        for (uint256 i = 0; i < _erc20CappedInterfaces().length; i++) {
            interfaces_[index] = _erc20CappedInterfaces()[i];
            index++;
        }

        for (uint256 i = 0; i < _erc20ControllerInterfaces().length; i++) {
            interfaces_[index] = _erc20ControllerInterfaces()[i];
            index++;
        }

        for (uint256 i = 0; i < _erc20SnapshotInterfaces().length; i++) {
            interfaces_[index] = _erc20SnapshotInterfaces()[i];
            index++;
        }
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC20_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 23;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeErc20.selector;
        selectors_[--selectorsLength] = this.initializeCap.selector;
        selectors_[--selectorsLength] = this.decimals.selector;
        selectors_[--selectorsLength] = this.symbol.selector;
        selectors_[--selectorsLength] = this.name.selector;
        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.transferFrom.selector;
        selectors_[--selectorsLength] = this.totalSupply.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
        selectors_[--selectorsLength] = this.mint.selector;
        selectors_[--selectorsLength] = this.burn.selector;
        selectors_[--selectorsLength] = this.burnFrom.selector;
        selectors_[--selectorsLength] = this.approve.selector;
        selectors_[--selectorsLength] = this.increaseAllowance.selector;
        selectors_[--selectorsLength] = this.decreaseAllowance.selector;
        selectors_[--selectorsLength] = this.allowance.selector;
        selectors_[--selectorsLength] = this.setCap.selector;
        selectors_[--selectorsLength] = this.cap.selector;
        selectors_[--selectorsLength] = this.snapshot.selector;
        selectors_[--selectorsLength] = this.balanceOfAt.selector;
        selectors_[--selectorsLength] = this.totalSupplyAt.selector;
        selectors_[--selectorsLength] = this.forceTransfer.selector;
        selectors_[--selectorsLength] = this.forceBurn.selector;
    }
}
