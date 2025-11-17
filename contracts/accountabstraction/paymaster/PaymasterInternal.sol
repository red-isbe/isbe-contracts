// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import {IPaymaster} from '@account-abstraction/contracts/interfaces/IPaymaster.sol';
import {IEntryPoint} from '@account-abstraction/contracts/interfaces/IEntryPoint.sol';
import {PackedUserOperation} from '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {
    SIG_VALIDATION_FAILED,
    SIG_VALIDATION_SUCCESS
} from '@account-abstraction/contracts/core/Helpers.sol';
import {IBasePaymaster} from './IBasePaymaster.sol';
import {DidDocumentDetailedInternal} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';
import {_AA_PAYMASTER_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @title Minimal whitelist-based ERC-4337 paymaster internals
 * @notice Internal mixin that gates sponsorship by a simple address whitelist and
 *         proxies staking and deposit actions to the ERC-4337 EntryPoint.
 * @dev Uses unstructured storage to keep layout decentralised across inheritance.
 *      Designed for composition; does not emit events or hold access control.
 *      Validation returns SIG_VALIDATION_* flags as required by EntryPoint.
 * @author ISBE Development Team
 */
abstract contract PaymasterInternal is DidDocumentDetailedInternal {
    /**
     * @notice Holds EntryPoint reference and the whitelist registry.
     * @param entryPoint ERC-4337 EntryPoint authorised to call validation hooks.
     * @param whitelist Mapping of user account to whitelisted flag.
     */
    struct PaymasterStorage {
        IEntryPoint entryPoint;
        mapping(address => bool) whitelist;
    }

    /**
     * @notice Verifies the provided EntryPoint implements the expected interface.
     * @dev Reverts with EntryPointInterfaceMismatch defined in IPaymaster when the
     *      target does not report support for IEntryPoint via ERC-165.
     * @param _entryPoint The EntryPoint instance to validate.
     */
    function _validateEntryPointInterface(
        IEntryPoint _entryPoint
    ) internal virtual {
        require(
            IERC165(address(_entryPoint)).supportsInterface(
                type(IEntryPoint).interfaceId
            ),
            IBasePaymaster.EntryPointInterfaceMismatch(address(_entryPoint))
        );
    }

    /**
     * @notice Sets the ERC-4337 EntryPoint reference.
     * @dev Caller MUST ensure single-run semantics during initialisation phases.
     * @param _entryPoint The EntryPoint contract used for callbacks.
     */
    function _initializePaymaster(IEntryPoint _entryPoint) internal {
        _setEntryPoint(_entryPoint);
    }

    /**
     * @notice Updates the EntryPoint reference.
     * @dev No access control is enforced here; the parent should restrict calls.
     * @param _entryPoint The EntryPoint to store.
     */
    function _setEntryPoint(IEntryPoint _entryPoint) internal {
        _validateEntryPointInterface(_entryPoint);
        _paymasterStorage().entryPoint = _entryPoint;
    }

    /**
     * @notice Returns the configured EntryPoint reference.
     * @return entryPoint_ The stored EntryPoint instance.
     */
    function _getEntryPoint() internal view returns (IEntryPoint entryPoint_) {
        entryPoint_ = _paymasterStorage().entryPoint;
    }

    /**
     * @notice Ensures the caller is the configured EntryPoint.
     * @dev Reverts with NotEntryPoint(_sender) when invoked by unauthorised
     *      callers. Should guard all EntryPoint-only hooks.
     */
    function _requireFromEntryPoint() internal view virtual {
        address _sender = _msgSender();
        require(
            _sender == address(_paymasterStorage().entryPoint),
            IBasePaymaster.NotEntryPoint(_sender)
        );
    }

    /**
     * @notice Adds a user account to the whitelist.
     * @dev Idempotent. No event is emitted by this internal helper.
     * @param _user The account permitted for sponsorship.
     */
    function _whitelist(address _user) internal {
        _paymasterStorage().whitelist[_user] = true;
    }

    /**
     * @notice Removes a user account from the whitelist.
     * @dev Idempotent. No event is emitted by this internal helper.
     * @param _user The account no longer permitted for sponsorship.
     */
    function _unwhitelist(address _user) internal {
        _paymasterStorage().whitelist[_user] = false;
    }

    /**
     * @notice Reports whether a user account is whitelisted.
     * @dev Reads internal storage only.
     * @param _user The account to check.
     * @return isAllowed True if whitelisted, false otherwise.
     */
    function _isWhitelisted(
        address _user
    ) internal view returns (bool isAllowed) {
        return _paymasterStorage().whitelist[_user];
    }

    /**
     * @notice Deposits Ether into EntryPoint on behalf of this paymaster.
     * @dev Sends value with the call. Parent MUST enforce access control.
     * @param _amount The amount of wei to deposit.
     */
    function _deposit(uint256 _amount) internal {
        _paymasterStorage().entryPoint.depositTo{value: _amount}(address(this));
    }

    /**
     * @notice Withdraws deposited funds from EntryPoint to a recipient.
     * @dev Parent MUST enforce permissions and liveness constraints.
     * @param _withdrawAddress The payable recipient address.
     * @param _amount The amount of wei to withdraw.
     */
    function _withdrawTo(
        address payable _withdrawAddress,
        uint256 _amount
    ) internal {
        _paymasterStorage().entryPoint.withdrawTo(_withdrawAddress, _amount);
    }

    /**
     * @notice Adds stake for this paymaster at EntryPoint.
     * @dev Value is forwarded to EntryPoint. Unstake delay can only increase.
     * @param _unstakeDelaySec The enforced unstake delay in seconds.
     * @param _amount The amount of wei to add to stake.
     */
    function _addStake(uint32 _unstakeDelaySec, uint256 _amount) internal {
        _paymasterStorage().entryPoint.addStake{value: _amount}(
            _unstakeDelaySec
        );
    }

    /**
     * @notice Returns the current deposit balance recorded in EntryPoint.
     * @return The amount of wei available for sponsorship.
     */
    function _getDeposit() internal view returns (uint256) {
        return _paymasterStorage().entryPoint.balanceOf(address(this));
    }

    /**
     * @notice Initiates stake unlock; paymaster cannot serve while unlocked.
     * @dev Add stake again before serving new requests.
     */
    function _unlockStake() internal {
        _paymasterStorage().entryPoint.unlockStake();
    }

    /**
     * @notice Withdraws the entire stake after the unlock delay.
     * @dev Requires prior unlock and elapsed delay per EntryPoint rules.
     * @param withdrawAddress The recipient of the withdrawn stake.
     */
    function _withdrawStake(address payable withdrawAddress) internal {
        _paymasterStorage().entryPoint.withdrawStake(withdrawAddress);
    }

    /**
     * @notice Validates a user operation against the whitelist policy.
     * @dev Caller MUST be EntryPoint. Ignores userOpHash and maxCost in this
     *      minimal policy. Returns success if sender is whitelisted. No context
     *      is required; an empty bytes is returned.
     * @param userOp The packed user operation received from EntryPoint.
     * @param userOpHash The EntryPoint-computed hash (unused here).
     * @param maxCost The upper bound of potential charge (unused here).
     * @return context Opaque data for postOp; empty when unused.
     * @return validationData Aggregated validity flags for EntryPoint.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal view returns (bytes memory context, uint256 validationData) {
        // silence unused warnings for this minimal policy
        (userOpHash, maxCost);

        address user = userOp.sender;

        context = abi.encode(user);

        if (_isWhitelisted(user) && _getDeposit() >= maxCost) {
            validationData = SIG_VALIDATION_SUCCESS;
            return (context, validationData);
        } else {
            validationData = SIG_VALIDATION_FAILED;
            return (context, validationData);
        }
    }

    /**
     * @notice Post-operation handler to complete settlement logic.
     * @dev Simply logs the outcome of the UserOperation handled (sponsored)
     *      by the Paymaster.
     * @param mode The post-op mode describing execution outcome.
     * @param context The opaque data returned by validatePaymasterUserOp.
     * @param actualGasCost The gas cost accrued so far, excluding this call.
     * @param actualUserOpFeePerGas The effective per-gas fee for the UserOp.
     */
    function _postOp(
        IPaymaster.PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal {
        (address userOpSender) = abi.decode(context, (address));
        (context, actualGasCost, actualUserOpFeePerGas);
        if (mode == IPaymaster.PostOpMode.postOpReverted) {
            emit IBasePaymaster.PostOpReverted(userOpSender);
            return;
        }

        emit IBasePaymaster.SponsoredUserOperation(
            userOpSender,
            mode,
            actualGasCost
        );
    }

    /**
     * @notice Accesses the paymaster storage at a fixed slot.
     * @dev Unstructured storage pattern; assembly limited to slot assignment.
     * @return storage_ The storage pointer to PaymasterStorage.
     */
    function _paymasterStorage()
        private
        pure
        returns (PaymasterStorage storage storage_)
    {
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := _AA_PAYMASTER_STORAGE_POSITION
        }
        // slither-disable-end assembly
    }
}
