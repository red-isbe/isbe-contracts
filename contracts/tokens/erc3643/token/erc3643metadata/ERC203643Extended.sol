// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20InternalCommon} from '../../../../erc20/extensions/ERC20InternalCommon.sol';

import {
    _ERC203_3643_EXTENDED_RESOLVER_KEY
} from '../../../../../constants/resolverKeys.sol';
import {IERC203643Extended} from './IERC203643Extended.sol';
import {_TOKEN_OWNER_ROLE} from '../../../../../constants/roles.sol';

/// @title ERC20Capped
/// @notice Implements capped mechanism
/// @dev Inherits from IERC20Capped and ERC20InternalCommon
abstract contract ERC203643Extended is IERC203643Extended, ERC20InternalCommon {
    constructor() {
        _disableInitializers(_ERC203_3643_EXTENDED_RESOLVER_KEY);
    }

    function initializeERC203643Extended(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        // _onchainID can be zero address if not set, can be set later by owner
        address _onchainID
    ) external initializer(_ERC203_3643_EXTENDED_RESOLVER_KEY) {
        //todo
    }

    //todo: modifiers y todo
    function setName(string memory _newName) external onlyRole(_TOKEN_OWNER_ROLE) {
        _setName(_newName);
        emit UpdatedTokenInformation(_newName, _symbol(), _decimals(), _version(), _onchainID());
    }

    function setSymbol(string memory _newSymbol) external onlyRole(_TOKEN_OWNER_ROLE) {
        _setSymbol(_newSymbol);
        emit UpdatedTokenInformation(_name(), _newSymbol, _decimals(), _version(), _onchainID());
    }

    function setOnchainID(address _newOnchainID) external onlyRole(_TOKEN_OWNER_ROLE) {
        _setOnchainID(_newOnchainID);
        emit UpdatedTokenInformation(_name(), _symbol(), _decimals(), _version(), _newOnchainID);
    }

    function onchainID() external view override returns (address) {
        return _onchainID();
    }

    function version() external view override returns (string memory) {
        return _version();
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
        interfaces_[--interfacesLength] = type(IERC203643Extended).interfaceId;
    }
}
