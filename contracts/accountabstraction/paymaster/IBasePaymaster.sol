// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IEntryPoint} from '@account-abstraction/contracts/interfaces/IEntryPoint.sol';
import {IPaymaster} from '@account-abstraction/contracts/interfaces/IPaymaster.sol';

/**
 * @title Base Paymaster Interface
 * @notice Defines the extended interface for a decentralised ERC-4337 paymaster
 *         responsible for sponsoring user operations through an EntryPoint contract.
 * @dev Extends the standard {IPaymaster} with administrative and lifecycle events.
 *      A compliant implementation MUST hold a sufficient deposit and stake to
 *      cover gas obligations and MUST interact exclusively with its configured
 *      EntryPoint. Functions that handle user operation validation SHOULD be
 *      callable only by the EntryPoint. Management actions (e.g. whitelisting,
 *      deposits, staking) SHOULD enforce strict access control.
 * @author ISBE Development Team
 */
interface IBasePaymaster is IPaymaster {
    /**
     * @notice Emitted when the paymaster is successfully initialised.
     * @param entryPoint The EntryPoint contract authorised to trigger callbacks.
     */
    event PaymasterInitialized(address entryPoint);

    /**
     * @notice Emitted when Ether is deposited to the paymaster for gas funding.
     * @param amount The amount of wei credited to the deposit.
     */
    event AmountDeposited(uint256 amount);

    /**
     * @notice Emitted when deposited funds are withdrawn from the paymaster.
     * @param to The recipient address receiving the withdrawn amount.
     * @param amount The amount of wei withdrawn from the deposit.
     */
    event AmountWithdrawn(address to, uint256 amount);

    /**
     * @notice Emitted when a stake is added to meet EntryPoint requirements.
     * @param amount The amount of wei added to the stake.
     * @param unstakeDelaySec The enforced unstake delay in seconds.
     */
    event StakeAdded(uint256 amount, uint32 unstakeDelaySec);

    /**
     * @notice Emitted when the paymaster’s stake is unlocked.
     */
    event StakedUnlocked();

    /**
     * @notice Emitted when a previously unlocked stake is withdrawn.
     * @param withdrawAddress The recipient receiving the withdrawn stake.
     */
    event StakeWithdrawn(address withdrawAddress);

    /**
     * @notice Emitted when the EntryPoint reference is updated.
     * @param entryPoint The new EntryPoint contract address.
     */
    event EntryPointUpdated(address entryPoint);

    /**
     * @notice Emitted after a user operation is processed and sponsored by the paymaster.
     * @dev Indicates the settlement outcome of a sponsored operation, including whether
     *      it succeeded or reverted, along with the total gas cost paid by the paymaster.
     *      Useful for accounting, analytics, and off-chain monitoring of sponsored activity.
     * @param userOpSender The sender address of the user operation that was sponsored.
     * @param mode The post-operation mode indicating success or failure of execution.
     * @param actualGasCost The total gas cost incurred and paid by the paymaster.
     */
    event SponsoredUserOperation(
        address indexed userOpSender,
        PostOpMode mode,
        uint256 actualGasCost
    );

    /**
     * @notice Emitted when a post-operation callback fails and triggers a revert recovery.
     * @dev This event signals that the EntryPoint invoked postOp but the call reverted,
     *      causing the EntryPoint to execute its internal cleanup process. No funds are
     *      refunded to the paymaster in this case.
     * @param userOpSender The sender address of the user operation that caused the revert.
     */
    event PostOpReverted(address indexed userOpSender);

    /**
     * @notice Thrown when a restricted function is invoked by an unauthorised caller.
     * @dev SHOULD be used to protect EntryPoint-only functions such as validation
     *      or post-operation hooks.
     * @param sender The address attempting to perform the restricted call.
     */
    error NotEntryPoint(address sender);

    /**
     * @notice Thrown when a provided EntryPoint does not implement the required interface.
     * @dev SHOULD be raised during initialisation or update if the ERC-165
     *      interface check for {IEntryPoint} fails.
     * @param entryPoint The non-conforming EntryPoint contract address.
     */
    error EntryPointInterfaceMismatch(address entryPoint);

    /**
     * @notice Initialises the paymaster with a valid EntryPoint reference.
     * @dev Implementations MUST verify ERC-165 support on the provided EntryPoint
     *      and MUST prevent re-initialisation. Emits {PaymasterInitialized}.
     * @param _entryPoint The EntryPoint contract to be associated with this paymaster.
     */
    function initializePaymaster(IEntryPoint _entryPoint) external;

    /**
     * @notice Deposits native funds used to pay gas on behalf of sponsored users.
     * @dev Ether MUST be sent with the call. Deposits are held by the EntryPoint.
     *      Access control MAY be applied to prevent accidental funding.
     */
    function deposit() external payable;

    /**
     * @notice Withdraws funds from the paymaster deposit.
     * @dev Implementations SHOULD restrict access to authorised administrators.
     * @param withdrawAddress The payable recipient of the withdrawn funds.
     * @param amount The amount of wei to withdraw.
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 amount
    ) external;

    /**
     * @notice Adds stake required by EntryPoint to secure paymaster operations.
     * @dev Ether MUST be sent with the call. The unstake delay is enforced
     *      by EntryPoint and can only be increased. Access control SHOULD restrict use.
     * @param unstakeDelaySec The minimum delay in seconds before stake can be unlocked.
     */
    function addStake(uint32 unstakeDelaySec) external payable;

    /**
     * @notice Initiates the stake unlock process to enable later withdrawal.
     * @dev After unlocking, the paymaster cannot serve new requests until restaked.
     *      Subject to EntryPoint timing rules and authorisation.
     */
    function unlockStake() external;

    /**
     * @notice Withdraws the entire stake after the unlock delay period.
     * @dev MUST only succeed once the delay has fully elapsed per EntryPoint rules.
     *      Access control SHOULD restrict withdrawal to authorised administrators.
     * @param withdrawAddress The payable recipient of the withdrawn stake.
     */
    function withdrawStake(address payable withdrawAddress) external;

    /**
     * @notice Returns the current deposit balance available for gas sponsorship.
     * @dev Mirrors the balance tracked in the EntryPoint contract.
     * @return The amount of wei currently available for sponsorship.
     */
    function getDeposit() external view returns (uint256);
}
