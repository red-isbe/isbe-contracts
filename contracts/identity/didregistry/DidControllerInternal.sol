// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../core/Common.sol';
import {_DID_CONTROLLERS_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @title Decentralised Identity Controller Management
 * @notice Internal abstract contract for managing DID controller relationships and mappings
 * @dev Provides foundational functionality for linking and managing relationships between
 *      decentralised identifiers and their controlling entities. Implements efficient
 *      storage patterns for controller-to-DID mappings with indexed access capabilities
 * @author ISBE Development Team
 */
abstract contract DidControllerInternal is Common {
    /**
     * @notice Storage structure for managing controller-to-DID relationships
     * @param didsByController Mapping from controller identifiers to arrays of controlled DIDs
     * @param didsByControllerIndex Mapping for efficient index lookup of DIDs by controller
     */
    struct ControllersStorage {
        mapping(string => string[]) didsByController;
        mapping(string => mapping(string => uint256)) didsByControllerIndex;
    }

    function _linkDidToController(
        string memory did,
        string memory controller
    ) internal returns (bool) {
        ControllersStorage storage $ = _controllersStorage();
        uint256 index = $.didsByController[controller].length;
        $.didsByController[controller].push(did);
        $.didsByControllerIndex[controller][did] = index;
        return true;
    }

    //    function _unlinkDidFromController(
    //        string memory _did,
    //        string memory _controller
    //    ) internal returns (bool) {
    //        ControllersStorage storage $ = _controllersStorage();
    //        string[] storage dids = $.didsByController[_controller];
    //        uint256 index = $.didsByControllerIndex[_controller][_did];
    //        uint256 lastDid = dids.length;
    //        unchecked {
    //            --lastDid;
    //        }
    //
    //        if (_equalStrings(dids[index], _did)) {
    //            // correct index
    //            dids[index] = dids[lastDid];
    //            // remap index
    //            $.didsByControllerIndex[_controller][_did] = 0;
    //            $.didsByControllerIndex[_controller][dids[index]] = index;
    //            dids.pop();
    //        }
    //        return true;
    //    }

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
