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

import {ERC203643InternalCommon} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC20Burnable} from './IERC20Burnable.sol';

/// @title ERC20Burnable
/// @notice Implements burn mechanism
/// @dev Inherits from IERC20Burnable and ERC203643InternalCommon
abstract contract ERC20Burnable is IERC20Burnable, ERC203643InternalCommon {
    function burn(
        uint256 _amount
    ) external override whenNotPaused onlyWhitelisted(_msgSender()) {
        _burn(_msgSender(), _amount);
        emit Burned(_msgSender(), _amount);
    }

    function burnFrom(
        address _account,
        uint256 _amount
    ) external override whenNotPaused onlyWhitelisted(_account) {
        _checkAddressIsNotZero(_account);
        _spendAllowance(_account, _msgSender(), _amount);
        _burn(_account, _amount);
        emit BurnedFrom(_msgSender(), _account, _amount);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC20Burnable).interfaceId;
    }
}
