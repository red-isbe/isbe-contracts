// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {IEntryPoint} from '@account-abstraction/contracts/interfaces/IEntryPoint.sol';

/**
 * @title ERC-4337 Paymaster Interface
 * @notice Defines the external surface for a decentralised paymaster that
 *         sponsors user operations through an ERC-4337 EntryPoint.
 * @dev Conforms to EntryPoint callbacks for validation and post-operation
 *      handling. A paymaster MUST be staked and funded to cover gas and the
 *      EntryPoint stake. Functions that interact with EntryPoint SHOULD
 *      restrict callers to the EntryPoint.
 * @author ISBE Development Team
 */
interface IPaymaster {
    /**
     * @notice Enumerates post-operation modes reported by EntryPoint.
     * @param none Default zero value; indicates unset and SHOULD be treated
     *             as invalid for external calls.
     * @param opSucceeded User operation succeeded; normal settlement applies.
     * @param opReverted  User operation reverted; gas remains payable.
     * @param postOpReverted Internal cleanup used by EntryPoint; not passed
     *                       to paymasters during postOp().
     */
    enum PostOpMode {
        none,
        opSucceeded,
        opReverted,
        postOpReverted
    }

    /**
     * @notice Emitted when the paymaster is initialised with an EntryPoint.
     * @param entryPoint The EntryPoint contract authorised to invoke callbacks.
     */
    event PaymasterInitialized(address entryPoint);

    /**
     * @notice Emitted when a user is added to the whitelist.
     * @param user The account newly permitted for sponsorship.
     */
    event UserWhiteListed(address user);

    /**
     * @notice Emitted when a user is removed from the whitelist.
     * @param user The account no longer permitted for sponsorship.
     */
    event UserUnwhiteListed(address user);

    /**
     * @notice Emitted when native funds are deposited to the paymaster.
     * @param amount The amount of wei credited to the deposit.
     */
    event AmountDeposited(uint256 amount);

    /**
     * @notice Emitted when native funds are withdrawn from the paymaster.
     * @param to The recipient address receiving the withdrawn funds.
     * @param amount The amount of wei debited from the deposit.
     */
    event AmountWithdrawn(address to, uint256 amount);

    /**
     * @notice Emitted when stake is added to satisfy EntryPoint requirements.
     * @param amount The amount of wei added to the stake.
     * @param unstakeDelaySec The enforced unstake delay in seconds.
     */
    event StakeAdded(uint256 amount, uint32 unstakeDelaySec);

    /**
     * @notice Emitted when the EntryPoint stake is unlocked.
     */
    event StakedUnlocked();

    /**
     * @notice Emitted when stake is withdrawn after the unlock delay.
     * @param withdrawAddress The recipient address receiving the stake.
     */
    event StakeWithdrawn(address withdrawAddress);

    /**
     * @notice Emitted when the stored EntryPoint reference is updated.
     * @param entryPoint The new EntryPoint contract address.
     */
    event EntryPointUpdated(address entryPoint);

    /**
     * @notice Thrown when a function restricted to EntryPoint is called by
     *         an unauthorised sender.
     * @dev Implementations SHOULD use this for validate/postOp entry checks.
     * @param sender The unauthorised caller address.
     */
    error NotEntryPoint(address sender);

    /**
     * @notice Thrown when the provided EntryPoint does not implement the
     *         expected interface.
     * @dev Implementations SHOULD revert with this during initialisation or
     *      updates when ERC-165 checks fail.
     * @param entryPoint The non-conforming EntryPoint address.
     */
    error EntryPointInterfaceMismatch(address entryPoint);

    /**
     * @notice Initialises the paymaster with an EntryPoint reference.
     * @dev Implementations SHOULD verify ERC-165 support on the EntryPoint and
     *      guard re-initialisation. Emits {PaymasterInitialized}.
     * @param _entryPoint The EntryPoint contract used for callbacks.
     */
    function initializePaymaster(IEntryPoint _entryPoint) external;

    /**
     * @notice Validates whether the paymaster agrees to sponsor a user op.
     * @dev MUST require msg.sender to be EntryPoint, else revert NotEntryPoint.
     *      SHOULD avoid state changes unless trusted by bundlers. The paymaster
     *      pre-pays from its deposit; refunds occur after postOp.
     * @param userOp The packed user operation received from EntryPoint.
     * @param userOpHash The hash of the user operation computed by EntryPoint.
     * @param maxCost The maximum potential cost as per userOp limits.
     * @return context Opaque data for postOp; empty when not required.
     * @return validationData Encoded signature/time-range validity:
     *         - <20 bytes> aggregatorOrSigFail: 0 for valid, 1 for sig failure.
     *         - <6 bytes>  validUntil: last valid timestamp, or 0 for indefinite.
     *         - <6 bytes>  validAfter: first valid timestamp.
     *         Implementations MUST NOT rely directly on block.timestamp/number.
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    /**
     * @notice Handles settlement after the user operation executes.
     * @dev MUST require msg.sender to be EntryPoint, else revert NotEntryPoint.
     *      Called even if the operation reverted; gas remains payable.
     * @param mode The post-operation mode indicating outcome.
     * @param context The opaque value returned by validatePaymasterUserOp.
     * @param actualGasCost The gas cost accrued so far, excluding this call.
     * @param actualUserOpFeePerGas The effective per-gas fee paid by the UserOp.
     *        Derived from maxFeePerGas, maxPriorityFee, and basefee; differs
     *        from tx.gasprice paid by the bundler.
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;

    /**
     * @notice Deposits native funds to cover sponsored gas costs.
     * @dev Funds are held for EntryPoint settlement. Ether MUST be sent.
     */
    function deposit() external payable;

    /**
     * @notice Withdraws deposit funds to a recipient.
     * @dev Implementations SHOULD restrict access to authorised operators or
     *      owners.
     * @param withdrawAddress The payable recipient of withdrawn funds.
     * @param amount The amount of wei to withdraw.
     */
    function withdrawTo(
        address payable withdrawAddress,
        uint256 amount
    ) external;

    /**
     * @notice Adds stake required by EntryPoint to secure obligations.
     * @dev Ether MUST be sent. The unstake delay is enforced by EntryPoint.
     * @param unstakeDelaySec The delay in seconds before stake can be unlocked.
     */
    function addStake(uint32 unstakeDelaySec) external payable;

    /**
     * @notice Initiates the stake unlock process, enabling withdrawal later.
     * @dev Subject to EntryPoint timing rules and implementation access control.
     */
    function unlockStake() external;

    /**
     * @notice Withdraws stake after the unlock delay has elapsed.
     * @dev MUST succeed only after the delay per EntryPoint rules.
     * @param withdrawAddress The payable recipient of the withdrawn stake.
     */
    function withdrawStake(address payable withdrawAddress) external;

    /**
     * @notice Adds a user address to the whitelist.
     * @dev Access control is application-defined; implementations SHOULD
     *      restrict this to authorised operators or owners.
     * @param user The account to permit for sponsorship.
     */
    function whitelist(address user) external;

    /**
     * @notice Removes a user address from the whitelist.
     * @dev Access control is application-defined; implementations SHOULD
     *      restrict this to authorised operators or owners.
     * @param user The account to revoke from sponsorship.
     */
    function unwhitelist(address user) external;

    /**
     * @notice Reports whether a user is currently whitelisted.
     * @param user The account to query.
     * @return isAllowed True if the account is whitelisted, false otherwise.
     */
    function isWhitelisted(address user) external view returns (bool isAllowed);

    /**
     * @notice Returns the current deposit balance available for gas.
     * @return The amount of wei held for sponsorship.
     */
    function getDeposit() external view returns (uint256);
}
