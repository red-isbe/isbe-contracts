// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IEntryPoint} from '@account-abstraction/contracts/interfaces/IEntryPoint.sol';
import {IPaymaster} from '@account-abstraction/contracts/interfaces/IPaymaster.sol';
import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {IBasePaymaster} from './IBasePaymaster.sol';
import {PaymasterInternal} from './PaymasterInternal.sol';
import {_ACCOUNT_ABSTRACTION_PAYMASTER_PAYMASTER_KEY} from '../../constants/resolverKeys.sol';
import {_ACCOUNT_ABSTRACTION_PAYMASTER_VERSION} from '../../constants/facetVersions.sol';
import {_DEFAULT_ADMIN_ROLE} from '../../constants/roles.sol';

/**
 * @title Paymaster Internal Implementation
 * @notice Concrete-facing layer that wires external IPaymaster calls to internal
 *         whitelist and staking logic for an ERC-4337 paymaster.
 * @dev Delegates core logic to PaymasterInternal and exposes EntryPoint callbacks.
 *      Access control and initialisation are expected from inherited mixins.
 *      Emits lifecycle, whitelist, deposit, and staking events defined in interface.
 *      Uses unstructured storage to remain layout-agnostic across upgrades.
 * @author ISBE Development Team
 */
abstract contract Paymaster is IBasePaymaster, PaymasterInternal {
    /**
     * @notice Initialises the paymaster with an EntryPoint reference.
     * @dev Verifies ERC-165 support on the given EntryPoint. Protected by
     *      {initializer} and {addressIsNotZero}. Emits {PaymasterInitialized}.
     * @param _entryPoint The EntryPoint contract used for validation callbacks.
     */
    function initializePaymaster(
        IEntryPoint _entryPoint
    )
        external
        onlyRole(_DEFAULT_ADMIN_ROLE)
        addressIsNotZero(address(_entryPoint))
        initializer(
            _ACCOUNT_ABSTRACTION_PAYMASTER_PAYMASTER_KEY,
            _ACCOUNT_ABSTRACTION_PAYMASTER_VERSION
        )
    {
        _initializePaymaster(_entryPoint);
        emit PaymasterInitialized(address(_entryPoint));
    }

    /**
     * @notice Handles settlement after the user operation executes.
     * @dev Requires EntryPoint caller. Forwards to internal handler. See
     *      IPaymaster for mode semantics and fee parameters.
     *      If you pause while there are already included UserOps in-flight
     *      that will later call postOp, you risk:
     *          - postOp reverting because contract is paused.
     *          - EntryPoint treating that as a misbehaving Paymaster.
     *      So, this method should NEVER revert.
     * @param mode The post-operation mode describing execution outcome.
     * @param context The opaque data returned by validatePaymasterUserOp.
     * @param actualGasCost The gas cost accrued so far, excluding this call.
     * @param actualUserOpFeePerGas The effective per-gas fee paid by the UserOp.
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external virtual override {
        _requireFromEntryPoint();
        _postOp(mode, context, actualGasCost, actualUserOpFeePerGas);
    }

    /**
     * @notice Deposits Ether for gas sponsorship via EntryPoint.
     * @dev Payable. Forwards value to EntryPoint. Emits {AmountDeposited}.
     *      Implementations MAY restrict callers through access control.
     */
    function deposit()
        external
        payable
        override
        onlyKnownDid(_msgSender())
        whenNotPaused
    {
        _deposit(msg.value);
        emit AmountDeposited(msg.value);
    }

    /**
     * @notice Withdraws deposit funds to a recipient.
     * @dev Restricted by {onlyKnownDid}. Emits {AmountWithdrawn}.
     * @param withdrawAddress The payable recipient address.
     * @param amount The amount of wei to withdraw.
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 amount
    ) external override onlyKnownDid(_msgSender()) whenNotPaused {
        _withdrawTo(withdrawAddress, amount);
        emit AmountWithdrawn(withdrawAddress, amount);
    }

    /**
     * @notice Adds stake required by EntryPoint to secure obligations.
     * @dev Payable. Restricted by {onlyKnownDid}. Unstake delay can only
     *      increase. Emits {StakeAdded}.
     * @param unstakeDelaySec The enforced unstake delay in seconds.
     */
    function addStake(
        uint32 unstakeDelaySec
    ) external payable override onlyKnownDid(_msgSender()) whenNotPaused {
        _addStake(unstakeDelaySec, msg.value);
        emit StakeAdded(msg.value, unstakeDelaySec);
    }

    /**
     * @notice Initiates the stake unlock process.
     * @dev Restricted by {onlyKnownDid}. The paymaster cannot serve while
     *      unlocked. Emits {StakedUnlocked}.
     */
    function unlockStake()
        external
        override
        onlyKnownDid(_msgSender())
        whenNotPaused
    {
        _unlockStake();
        emit StakedUnlocked();
    }

    /**
     * @notice Withdraws stake after the unlock delay has elapsed.
     * @dev Restricted by {onlyKnownDid}. Requires prior unlock and elapsed
     *      delay per EntryPoint rules. Emits {StakeWithdrawn}.
     * @param withdrawAddress The recipient of the withdrawn stake.
     */
    function withdrawStake(
        address payable withdrawAddress
    ) external override onlyKnownDid(_msgSender()) whenNotPaused {
        _withdrawStake(withdrawAddress);
        emit StakeWithdrawn(withdrawAddress);
    }

    /**
     * @notice Returns the current deposit balance held in EntryPoint.
     * @dev View proxy to EntryPoint balance for this paymaster.
     * @return The amount of wei available for sponsorship.
     */
    function getDeposit() external view override returns (uint256) {
        return _getDeposit();
    }

    /**
     * @notice Validates whether the paymaster agrees to sponsor a user operation.
     * @dev Forwards to internal policy. MUST be called by EntryPoint. See
     *      IPaymaster for return encoding and timing semantics.
     * @param userOp The packed user operation received from EntryPoint.
     * @param userOpHash The hash computed by EntryPoint for this operation.
     * @param maxCost The upper bound of potential cost for this operation.
     * @return context Opaque data forwarded to {postOp}; empty if unused.
     * @return validationData Encoded validity flags per ERC-4337 rules.
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    )
        external
        view
        override
        whenNotPaused
        returns (bytes memory context, uint256 validationData)
    {
        _requireFromEntryPoint();
        (context, validationData) = _validatePaymasterUserOp(
            userOp,
            userOpHash,
            maxCost
        );
    }

    /**
     * @notice Updates the EntryPoint reference.
     * @dev Restricted by {onlyKnownDid}. Emits {EntryPointUpdated}.
     * @param entryPoint The new EntryPoint contract to store.
     */
    function setEntryPoint(
        IEntryPoint entryPoint
    ) external onlyRole(_DEFAULT_ADMIN_ROLE) whenPaused {
        _setEntryPoint(entryPoint);
        emit EntryPointUpdated(address(entryPoint));
    }

    /**
     * @notice Returns the configured EntryPoint reference.
     * @dev View helper; does not perform external calls.
     * @return entryPoint_ The stored EntryPoint instance.
     */
    function getEntryPoint() external view returns (IEntryPoint entryPoint_) {
        entryPoint_ = _getEntryPoint();
    }

    /**
     * @notice Declares supported interfaces for ERC-165 discovery.
     * @dev Returns the IPaymaster interface id for introspection by parents.
     * @return interfaces_ Array of supported interface identifiers.
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](2);
        interfaces_[0] = type(IBasePaymaster).interfaceId;
        interfaces_[1] = type(IPaymaster).interfaceId;
    }
}
