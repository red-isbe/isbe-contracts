// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC165} from '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '@account-abstraction/contracts/interfaces/PackedUserOperation.sol';
import {DidDocumentDetailedInternal} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';
// TODO: Import our own
import '@account-abstraction/contracts/interfaces/IEntryPoint.sol';
import './ISmartAccount.sol';
import {MessageHashUtils} from '../MessageHashUtils.sol';
import {ECDSA} from '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import {_ACCOUNT_ABSTRACTION_SMART_ACCOUNT_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @title ERC-4337 smart account internals
 * @notice Provides core internal functionality for a decentralised smart account.
 * @dev Uses unstructured storage to keep layout decentralised across inheritance.
 *      Handles signature validation, prefund settlement and controlled execution.
 *      Designed for integration with EntryPoint-based account abstraction flows.
 *      Ownership controls are inherited and used to authorise privileged calls.
 *      Expects external orchestration via the EntryPoint contract.
 * @author ISBE Development Team
 */
abstract contract SmartAccountInternal is DidDocumentDetailedInternal {
    struct SmartAccountStorage {
        /**
         * @notice Reference to the authorised EntryPoint contract.
         * @dev Used to validate call origin and to handle prefund settlements.
         */
        IEntryPoint entryPoint;
    }

    /**
     * @notice Status code returned when signature verification fails.
     * @dev Follows the EntryPoint's validationData convention.
     */
    uint256 private constant _SIGNATURE_VALIDATION_FAILED = 1;

    /**
     * @notice Status code returned when signature verification succeeds.
     * @dev Follows the EntryPoint's validationData convention.
     */
    uint256 private constant _SIGNATURE_VALIDATION_SUCCESS = 0;

    /**
     * @notice Sets the ERC-4337 EntryPoint reference.
     * @dev Caller MUST ensure single-run semantics during initialisation phases.
     * @param entryPoint The EntryPoint contract.
     */
    function _initializeSmartAccount(IEntryPoint entryPoint) internal {
        _setEntryPoint(entryPoint);
    }

    /**
     * @notice Updates the EntryPoint reference.
     * @dev No access control is enforced here; the parent should restrict calls.
     * @param entryPoint The EntryPoint to store.
     */
    function _setEntryPoint(IEntryPoint entryPoint) internal {
        _validateEntryPointInterface(entryPoint);
        _smartAccountStorage().entryPoint = entryPoint;
    }

    /**
     * @notice Verifies the provided EntryPoint implements the expected interface.
     * @dev Reverts with EntryPointInterfaceMismatch defined in ISmartAccount when the
     *      target does not report support for IEntryPoint via ERC-165.
     * @param entryPoint The EntryPoint instance to validate.
     */
    function _validateEntryPointInterface(
        IEntryPoint entryPoint
    ) internal virtual {
        require(
            IERC165(address(entryPoint)).supportsInterface(
                type(IEntryPoint).interfaceId
            ),
            ISmartAccount.EntryPointInterfaceMismatch(address(entryPoint))
        );
    }

    /**
     * @notice Executes a call on behalf of the smart account.
     * @dev Requires caller to be EntryPoint or owner. Propagates revert data
     *      on downstream failure. Does not validate calldata shape.
     * @param dest The target contract or externally owned account.
     * @param value The amount of ETH forwarded with the call.
     * @param functionData The ABI-encoded function call data.
     */
    function _execute(
        address dest,
        uint256 value,
        bytes calldata functionData
    ) internal {
        (bool success, bytes memory result) = dest.call{value: value}(
            functionData
        );
        if (!success) {
            revert ISmartAccount.SmartAccount_CallFailed(result);
        }
    }

    /**
     * @notice Validates a user's signature and processes prefund settlement.
     * @dev Must be invoked by EntryPoint. Returns validationData encoding
     *      signature validity. Ensures prefund is paid when required.
     * @param userOp The complete user operation being executed.
     * @param userOpHash The request hash used for signature verification.
     * @param missingAccountFunds Missing funds on the account's deposit in the sender (entrypoint).
     *                            In case there is a paymaster in the request, this value will be zero.
     * @return validationData 0 for valid signature, 1 to mark signature failure.
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) internal returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /**
     * @notice Restricts execution to calls originating from the EntryPoint.
     * @dev Reverts when unauthorised.
     */
    function _requireFromEntryPoint() internal view {
        require(
            _msgSender() == address(_smartAccountStorage().entryPoint),
            ISmartAccount.SmartAccount_NotFromEntryPoint()
        );
    }

    /**
     * @notice Restricts execution to calls from EntryPoint or the account owner.
     * @dev Reverts when unauthorised.
     */
    function _requireFromEntryPointOrOwner() internal view {
        require(
            _msgSender() == address(_smartAccountStorage().entryPoint) ||
                _msgSender() == _owner(),
            ISmartAccount.SmartAccount_NotFromEntryPointOrOwner()
        );
    }

    /**
     * @notice Pays the prefund required by EntryPoint when necessary.
     * @dev Transfers missing funds back to EntryPoint. Uses maximum gas to
     *      avoid out-of-gas inconsistencies. No revert on failed transfer.
     * @param missingAccountFunds Amount required to settle prefund.
     */
    function _payPrefund(uint256 missingAccountFunds) private {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(_msgSender()).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }('');
            (success);
        }
    }

    /**
     * @notice Validates the signature attached to a user operation.
     * @dev Recovers signer from an Ethereum-signed message hash and compares
     *      it with the authorised owner. Returns EntryPoint-compatible flag.
     * @param userOp The user operation containing the signature.
     * @param userOpHash The original request hash prior to ETH wrapping.
     * @return validationData Zero for success, non-zero for failure.
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) private view returns (uint256) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            userOpHash
        );
        return
            ECDSA.recover(ethSignedMessageHash, userOp.signature) == _owner()
                ? _SIGNATURE_VALIDATION_SUCCESS
                : _SIGNATURE_VALIDATION_FAILED;
    }

    /**
     * @notice Returns the storage slot for smart account
     * @dev Uses inline assembly to return storage struct at predefined slot
     * @return storage_ The smart account storage struct
     */
    function _smartAccountStorage()
        private
        pure
        returns (SmartAccountStorage storage storage_)
    {
        bytes32 position = _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
