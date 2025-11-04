// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDidController} from './interfaces/IDidController.sol';
import {DidDocumentDetailedInternal} from './DidDocumentDetailedInternal.sol';
import {_DID_CONTROLLERS_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {LibCommon} from '../../core/LibCommon.sol';

/**
 * @title Decentralised Identity Controller Management
 * @notice Internal abstract contract for managing DID controller relationships and mappings
 * @dev Provides foundational functionality for linking and managing relationships between
 *      decentralised identifiers and their controlling entities. Implements efficient
 *      storage patterns for controller-to-DID mappings with indexed access capabilities
 * @author ISBE Development Team
 */
abstract contract DidControllerInternal is DidDocumentDetailedInternal {
    /**
     * @notice Storage structure for managing controller-to-DID relationships
     * @param didsByController Mapping from controller identifiers to arrays of controlled DIDs
     * @param didsByControllerIndex Mapping for efficient index lookup of DIDs by controller
     */
    struct ControllersStorage {
        mapping(bytes32 controller => bytes32[] dids) didsByController;
        mapping(bytes32 controller => mapping(bytes32 did => uint256 index)) didsByControllerIndex;
    }

    modifier onlyControllerOrAuth(bytes32 did) {
        _checkControllerOrAuth(did);
        _;
    }

    modifier onlyNotController(bytes32 did, bytes32 controller) {
        _checkIsNotController(did, controller);
        _;
    }

    modifier onlyController(bytes32 did, bytes32 controller) {
        _checkIsController(did, controller);
        _;
    }

    modifier onlyNotLastController(bytes32 did, bytes32 controller) {
        _checkNotLastController(did, controller);
        _;
    }

    function _linkDidToController(
        bytes32 did,
        bytes32 controller
    ) internal returns (bool) {
        ControllersStorage storage $ = _controllersStorage();
        uint256 index = $.didsByController[controller].length;
        $.didsByController[controller].push(did);
        $.didsByControllerIndex[controller][did] = index;
        return _addControllerToDocument(did, controller);
    }

    function _unlinkDidFromController(
        bytes32 _did,
        bytes32 _controller
    ) internal returns (bool) {
        ControllersStorage storage $ = _controllersStorage();
        bytes32[] storage dids = $.didsByController[_controller];
        uint256 index = $.didsByControllerIndex[_controller][_did];
        uint256 lastDid = dids.length;
        unchecked {
            --lastDid;
        }
        // correct index
        dids[index] = dids[lastDid];
        // remap index
        $.didsByControllerIndex[_controller][_did] = 0;
        $.didsByControllerIndex[_controller][dids[index]] = index;
        dids.pop();
        return _removeControllerToDocument(_did, _controller);
    }

    function _getDidsByController(
        bytes32 controller,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            bytes32[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        bytes32[] storage dids = _controllersStorage().didsByController[
            controller
        ];
        total_ = dids.length;
        uint256 cursor;
        (cursor, howMany_, prev_, next_) = LibCommon.getPaginationParameters(
            dids.length,
            _page,
            _pageSize
        );
        if (howMany_ == 0) return (items_, total_, howMany_, prev_, next_);
        items_ = new bytes32[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = dids[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _checkControllerOrAuth(bytes32 did) private view {
        _checkBytes32IsNotZero(did);
        address sender = _msgSender();
        require(
            _isController(did, sender),
            IDidController.ControllerNotAuthorized(did, sender)
        );
    }

    function _checkIsController(bytes32 did, bytes32 controller) private view {
        require(
            _isController(did, controller),
            IDidController.DidIsNotControlledBy(did, controller)
        );
    }

    function _checkIsNotController(
        bytes32 did,
        bytes32 controller
    ) private view {
        require(
            _isNotController(did, controller),
            IDidController.DidIsControlledBy(did, controller)
        );
    }

    function _checkNotLastController(
        bytes32 did,
        bytes32 controller
    ) private view {
        require(
            _getControllerCount(did) > 1,
            IDidController.CannotLeaveDidWithoutControllers(did, controller)
        );
    }

    function _controllersStorage()
        private
        pure
        returns (ControllersStorage storage storage_)
    {
        bytes32 position = _DID_CONTROLLERS_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
