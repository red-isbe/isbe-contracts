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

import {
    ERC203643InternalCommon
} from '../../../erc203643/ERC203643InternalCommon.sol';
import {IERC3643Metadata} from './IERC3643Metadata.sol';
import {_METADATA_ROLE} from '../../../../constants/roles.sol';

/**
 * @title ERC3643Metadata
 * @notice External contract implementing ERC-3643 metadata management.
 * @dev Provides public methods to update and retrieve token metadata such as name, symbol,
 *      onchain identity, and version. Uses METADATA_ROLE for granular permission control.
 */
abstract contract ERC3643Metadata is IERC3643Metadata, ERC203643InternalCommon {
    /**
     * @notice Updates the token name.
     * @dev Restricted to metadata role. Requires non-empty input and unpaused state.
     *      Updates the ERC20 name storage and emits regulatory compliance event.
     * @param _newName The new name to assign to the token.
     *
     * Requirements:
     * - Caller must have METADATA_ROLE
     * - Contract must not be paused
     * - _newName must not be empty
     *
     * Emits:
     * - {UpdatedTokenInformation} event with all current token metadata
     */
    function setName(
        string memory _newName
    )
        external
        override
        onlyRole(_METADATA_ROLE)
        emptyString(_newName)
        whenNotPaused
    {
        _setName(_newName);
        emit NameSet(_msgSender(), _newName);
        emit UpdatedTokenInformation(_newName, _symbol(), _decimals());
    }

    /**
     * @notice Updates the token symbol.
     * @dev Restricted to metadata role. Requires non-empty input and unpaused state.
     *      Updates the ERC20 symbol storage and emits regulatory compliance event.
     * @param _newSymbol The new symbol to assign to the token.
     *
     * Requirements:
     * - Caller must have METADATA_ROLE
     * - Contract must not be paused
     * - _newSymbol must not be empty
     *
     * Emits:
     * - {UpdatedTokenInformation} event with all current token metadata
     */
    function setSymbol(
        string memory _newSymbol
    )
        external
        override
        onlyRole(_METADATA_ROLE)
        emptyString(_newSymbol)
        whenNotPaused
    {
        _setSymbol(_newSymbol);
        emit SymbolSet(_msgSender(), _newSymbol);
        emit UpdatedTokenInformation(_name(), _newSymbol, _decimals());
    }

    /**
     * @dev Declares the interfaces implemented by this facet.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IERC3643Metadata).interfaceId;
    }
}
