// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../../core/Common.sol';
import {IERC3643Freeze} from './IERC3643Freeze.sol';
import {_ERC3643_FREEZE_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/**
 * @title ERC3643FreezeInternal
 * @notice Internal contract for managing ERC-3643 freeze functionality.
 * @dev Provides internal functions to freeze/unfreeze addresses and partial balances.
 *      This contract does not emit events or apply access control.
 *      It is intended to be used by external contracts that handle authorization and event emission.
 */
abstract contract ERC3643FreezeInternal is Common {
    /// @dev Storage structure for ERC-3643 freeze.
    struct ERC3643FreezeStorage {
        mapping(address => bool) frozen; // full address freeze
        mapping(address => uint256) frozenTokens; // partial token freeze
    }

    /**
     * @dev Internal function to set an address frozen or unfrozen.
     * @param _userAddress The wallet address to update.
     * @param _freeze The freeze status (`true` = frozen, `false` = unfrozen).
     */
    function _setAddressFrozen(address _userAddress, bool _freeze) internal {
        _erc3643FreezeStorage().frozen[_userAddress] = _freeze;
    }

    /**
     * @dev Internal function to increase the amount of frozen tokens for an address.
     * @param _userAddress The wallet address to freeze tokens for.
     * @param _amount The amount of tokens to freeze.
     */
    function _freezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) internal {
        _erc3643FreezeStorage().frozenTokens[_userAddress] += _amount;
    }

    /**
     * @dev Internal function to decrease the amount of frozen tokens for an address.
     * @param _userAddress The wallet address to unfreeze tokens for.
     * @param _amount The amount of tokens to unfreeze.
     */
    function _unfreezePartialTokens(
        address _userAddress,
        uint256 _amount
    ) internal {
        uint256 frozen = _erc3643FreezeStorage().frozenTokens[_userAddress];

        require(
            frozen >= _amount,
            IERC3643Freeze.UnfreezeAmountExceedsFrozen(
                _userAddress,
                _amount,
                frozen
            )
        );

        _erc3643FreezeStorage().frozenTokens[_userAddress] -= _amount;
    }

    /**
     * @dev Internal view function to check if an address is fully frozen.
     * @param _userAddress The wallet address to check.
     * @return True if the address is frozen, false otherwise.
     */
    function _isFrozen(address _userAddress) internal view returns (bool) {
        return _erc3643FreezeStorage().frozen[_userAddress];
    }

    /**
     * @dev Internal view function to get the amount of partially frozen tokens for an address.
     * @param _userAddress The wallet address to check.
     * @return The amount of frozen tokens.
     */
    function _getFrozenTokens(
        address _userAddress
    ) internal view returns (uint256) {
        return _erc3643FreezeStorage().frozenTokens[_userAddress];
    }

    /**
     * @dev Internal function to access the ERC-3643 freeze storage slot.
     * Uses inline assembly to set the storage pointer.
     * @return storage_ Reference to the ERC3643FreezeStorage struct in storage.
     */
    function _erc3643FreezeStorage()
        private
        pure
        returns (ERC3643FreezeStorage storage storage_)
    {
        bytes32 position = _ERC3643_FREEZE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
