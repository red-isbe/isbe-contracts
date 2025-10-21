// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC203643InternalCommon} from '../ERC203643InternalCommon.sol';
import {IERC203643Capped} from './IERC203643Capped.sol';
import {IERC203643Errors} from '../IERC203643Errors.sol';
import {_ERC203643_CAPPED_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {_CAP_ROLE, _MINTER_ROLE} from '../../../constants/roles.sol';

/// @title ERC203643Capped
/// @notice Implements unified capped mechanism with minting functionality for both ERC20 and ERC3643 tokens
/// @dev Inherits from IERC203643Capped and ERC203643InternalCommon
///      Behavior adapts automatically based on token type through internal logic
abstract contract ERC203643Capped is IERC203643Capped, ERC203643InternalCommon {
    constructor() {
        _disableInitializers(_ERC203643_CAPPED_RESOLVER_KEY);
    }

    /**
     * @notice Initializes the maximum supply cap for the token
     * @dev Can only be called once during contract initialization.
     *      Emits a {CapSet} event if successful.
     * @param _newCap The desired maximum token supply cap
     */
    function initializeCap(
        uint256 _newCap
    )
        external
        initializer(_ERC203643_CAPPED_RESOLVER_KEY)
        checkNewCap(_newCap)
    {
        _setCap(_newCap);
        emit CapSet(_msgSender(), _newCap);
    }

    /**
     * @notice Mint tokens to an address
     * @dev Works for both ERC20 and ERC3643 tokens with automatic behavior adaptation.
     *      ERC3643-specific logic (identity verification) is handled automatically in
     *      ERC203643InternalCommon._beforeTokenTransfer.
     *
     *      Respects the cap limit set for the token.
     *
     *      Emits a {Transfer} event from address(0) via {_mint}.
     *
     * @param _to The address to mint tokens to
     * @param _amount The number of tokens to mint
     */
    function mint(
        address _to,
        uint256 _amount
    ) external checkCap(_amount) whenNotPaused onlyRole(_MINTER_ROLE) {
        _mint(_to, _amount);
    }

    /**
     * @notice Mint tokens to multiple addresses by an authorized minter (batch operation)
     * @dev No approval required from token holders.
     *      Respects the supply cap - will revert if minting would exceed the cap.
     *
     *      **ERC20 Mode:** Simple batch minting without additional validations
     *      **ERC3643 Mode:** Requires all recipients to be verified in Identity Registry
     *
     *      IMPORTANT: THIS TRANSACTION COULD EXCEED GAS LIMIT IF `_toList.length` IS TOO HIGH,
     *      USE WITH CARE OR YOU COULD LOSE TX FEES WITH AN "OUT OF GAS" TRANSACTION
     *
     * @param _toList The addresses to mint tokens to (all must be verified for ERC3643)
     * @param _amounts The number of tokens to mint to each corresponding address
     *
     * Requirements:
     * - Caller must have MINTER_ROLE
     * - Contract must not be paused
     * - Arrays must have the same length
     * - For ERC3643: all addresses in `_toList` must be verified in Identity Registry
     * - Total supply after minting must not exceed cap
     *
     * Emits:
     * - {Transfer} event from address(0) for each mint via internal mint mechanism
     *
     * Reverts:
     * - {CapExceeded} if batch minting would exceed the supply cap
     */
    function batchMint(
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external override whenNotPaused onlyRole(_MINTER_ROLE) {
        if (_toList.length != _amounts.length) {
            revert IERC203643Errors.ArrayLengthMismatch();
        }

        // Calculate total amount to check cap
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; ++i) {
            totalAmount += _amounts[i];
        }

        // Check cap for the entire batch
        require(
            _totalSupply() + totalAmount <= _cap(),
            IERC203643Capped.CapExceeded()
        );

        // Perform individual mints
        for (uint256 i = 0; i < _toList.length; ++i) {
            _mint(_toList[i], _amounts[i]);
        }
    }

    /**
     * @notice Update the supply cap
     * @dev Administrative function to modify the maximum token supply.
     *      Emits a {CapSet} event if successful.
     * @param _newCap The new maximum supply cap
     */
    function setCap(
        uint256 _newCap
    ) external checkNewCap(_newCap) whenNotPaused onlyRole(_CAP_ROLE) {
        _setCap(_newCap);
        emit CapSet(_msgSender(), _newCap);
    }

    /**
     * @notice Get the current supply cap
     * @return The maximum number of tokens that can exist
     */
    function cap() external view returns (uint256) {
        return _cap();
    }

    /**
     * @dev Declares the interfaces implemented by this contract.
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
        interfaces_[--interfacesLength] = type(IERC203643Capped).interfaceId;
    }
}
