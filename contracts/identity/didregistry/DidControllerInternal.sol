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
        mapping(string => string[]) didsByController;
        mapping(string => mapping(string => uint256)) didsByControllerIndex;
    }

    modifier onlyControllerOrAuth(string memory did) {
        _checkControllerOrAuth(did);
        _;
    }

    modifier onlyNotController(string memory did, string memory controller) {
        _checkIsNotController(did, controller);
        _;
    }

    modifier onlyController(string memory did, string memory controller) {
        _checkIsController(did, controller);
        _;
    }

    function _linkDidToController(
        string memory did,
        string memory controller
    ) internal returns (bool) {
        ControllersStorage storage $ = _controllersStorage();
        uint256 index = $.didsByController[controller].length;
        $.didsByController[controller].push(did);
        $.didsByControllerIndex[controller][did] = index;
        return _addControllerToDocument(did, controller);
    }

    function _unlinkDidFromController(
        string memory _did,
        string memory _controller
    ) internal returns (bool) {
        ControllersStorage storage $ = _controllersStorage();
        string[] storage dids = $.didsByController[_controller];
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
        string memory controller,
        uint256 _page,
        uint256 _pageSize
    )
        internal
        view
        returns (
            string[] memory items_,
            uint256 total_,
            uint256 howMany_,
            uint256 prev_,
            uint256 next_
        )
    {
        string[] storage dids = _controllersStorage().didsByController[
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
        items_ = new string[](howMany_);
        for (uint256 i; i < howMany_; ) {
            items_[i] = dids[cursor];
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _checkControllerOrAuth(string memory did) private view {
        _checkEmptyString(did);
        address sender = _msgSender();
        require(
            _isController(did, sender),
            IDidController.ControllerNotAuthorized(did, sender)
        );
    }

    function _checkIsController(
        string memory did,
        string memory controller
    ) private view {
        require(
            _isController(did, controller),
            IDidController.DidIsNotControlledBy(did, controller)
        );
    }

    function _checkIsNotController(
        string memory did,
        string memory controller
    ) private view {
        require(
            _isNotController(did, controller),
            IDidController.DidIsControlledBy(did, controller)
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
