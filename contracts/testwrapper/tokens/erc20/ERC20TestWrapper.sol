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
import {ISBEPause} from '../../../pause/ISBEPause.sol';
import {
    IsbeUUPSUpgradeable
} from '../../../proxies/utils/IsbeUUPSUpgradeable.sol';

// solhint-disable-next-line
contract ERC20TestWrapper is
    ERC20,
    ERC20Burnable,
    ERC20Capped,
    ERC20Snapshot,
    ERC20Controller,
    ISBEPause,
    IsbeUUPSUpgradeable
{
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
        uint256 selectorsLength = 22;
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
        selectors_[--selectorsLength] = this.balanceOfAt.selector;
        selectors_[--selectorsLength] = this.totalSupplyAt.selector;
        selectors_[--selectorsLength] = this.forceTransfer.selector;
        selectors_[--selectorsLength] = this.forceBurn.selector;
    }

    function _mint(address account, uint256 amount) internal virtual override {
        super._mint(account, amount);
    }

    // solhint-disable-next-line
    function _authorizeUpgrade(address newImplementation) internal override {}
}
