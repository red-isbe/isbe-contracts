// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {IAnchoringCore, BlockInfo, _buildBlockInfo} from './IAnchoringCore.sol';
import {Common} from '../../core/Common.sol';
import {LibCommon} from '../../core/LibCommon.sol';
import {_ANCHORING_STORAGE_POSITION} from '../../constants/storagePositions.sol';

/**
 * @title AnchoringCoreInternal
 * @author ISBE Team
 * @notice Internal implementation of anchoring functionality
 * @dev Provides core functionality for multi-chain block anchoring with optimized storage management.
 *      Each chain maintains its own independent anchoring history with enforced sequential block ordering.
 *      Supports efficient queries for block retrieval, range queries, and pagination across multiple chains.
 */
abstract contract AnchoringCoreInternal is Common {
    using EnumerableSet for EnumerableSet.UintSet;
    using LibCommon for EnumerableSet.UintSet;

    /// @notice Per-chain anchoring data
    struct ChainAnchoringData {
        mapping(uint256 blockNumber => BlockInfo) blockByNumber;
        EnumerableSet.UintSet anchoredBlockNumbers;
    }

    /// @notice Storage structure for multi-chain anchoring datas
    struct AnchoringStorage {
        mapping(uint256 chainId => ChainAnchoringData) anchoredChains;
        EnumerableSet.UintSet registeredChainIds;
    }

    modifier onlyUnregisteredChain(uint256 _chainId) {
        _checkUnregisteredChain(_chainId);
        _;
    }

    modifier onlyRegisteredChain(uint256 _chainId) {
        _checkRegisteredChain(_chainId);
        _;
    }

    function _registerChain(uint256 _chainId) internal {
        _anchoringStorage().registeredChainIds.add(_chainId);
    }

    function _anchorBlock(
        uint256 _chainId,
        uint256 _blockNumber,
        bytes32 _blockHash,
        bytes32 _stateRoot,
        address _anchorer
    ) internal returns (uint256 timestamp_) {
        timestamp_ = _blockTimestamp();
        _storeAnchoredBlock(
            _chainId,
            _blockNumber,
            _blockHash,
            _stateRoot,
            timestamp_,
            _anchorer
        );
    }

    function _anchorBlocksBatchInternal(
        uint256 _chainId,
        uint256[] calldata _blockNumbers,
        bytes32[] calldata _blockHashes,
        bytes32[] calldata _stateRoots,
        uint256 _length,
        address _anchorer
    ) internal returns (uint256 timestamp_) {
        timestamp_ = _blockTimestamp();
        for (uint256 index; index < _length; ) {
            _storeAnchoredBlock(
                _chainId,
                _blockNumbers[index],
                _blockHashes[index],
                _stateRoots[index],
                timestamp_,
                _anchorer
            );
            unchecked {
                ++index;
            }
        }
    }

    function _getLastAnchoredBlock(
        uint256 _chainId
    ) internal view returns (BlockInfo memory blockInfo_) {
        unchecked {
            EnumerableSet.UintSet
                storage anchoredBlockNumbers = _anchoringStorage()
                    .anchoredChains[_chainId]
                    .anchoredBlockNumbers;
            uint256 length = anchoredBlockNumbers.length();
            blockInfo_ = length == 0
                ? blockInfo_
                : _getBlockInfo(_chainId, anchoredBlockNumbers.at(length - 1));
        }
    }

    function _getAnchoredBlock(
        uint256 _chainId,
        uint256 _blockNumber
    ) internal view returns (BlockInfo memory blockInfo_) {
        blockInfo_ = _anchoringStorage()
            .anchoredChains[_chainId]
            .anchoredBlockNumbers
            .contains(_blockNumber)
            ? _getBlockInfo(_chainId, _blockNumber)
            : blockInfo_;
    }

    function _isBlockAnchored(
        uint256 _chainId,
        uint256 _blockNumber
    ) internal view returns (bool) {
        return
            _anchoringStorage()
                .anchoredChains[_chainId]
                .anchoredBlockNumbers
                .contains(_blockNumber);
    }

    function _getLastNBlocks(
        uint256 _chainId,
        uint256 _count
    ) internal view returns (BlockInfo[] memory blockInfos_) {
        if (_count == 0) return blockInfos_;
        EnumerableSet.UintSet storage anchoredBlockNumbers = _anchoringStorage()
            .anchoredChains[_chainId]
            .anchoredBlockNumbers;
        uint256 totalAnchors = anchoredBlockNumbers.length();

        if (totalAnchors == 0) return blockInfos_;

        uint256 start;
        uint256 length;
        unchecked {
            start = totalAnchors > _count ? totalAnchors - _count : 0;
            length = totalAnchors > _count ? _count : totalAnchors;
        }
        blockInfos_ = new BlockInfo[](length);
        for (uint256 i; i < length; ) {
            blockInfos_[i] = _getBlockInfo(
                _chainId,
                anchoredBlockNumbers.at(start)
            );
            unchecked {
                ++i;
                ++start;
            }
        }
    }

    function _getBlocksInRange(
        uint256 _chainId,
        uint256 _fromBlock,
        uint256 _toBlock
    ) internal view returns (BlockInfo[] memory blockInfos_) {
        if (_fromBlock > _toBlock) return blockInfos_;

        (
            uint256[] memory blockNumbersAnchored,
            uint256 blockInfosLength
        ) = _getBlockNumbersAnchoredInRange(_chainId, _fromBlock, _toBlock);
        blockInfos_ = _buildBlockInfos(
            _chainId,
            blockNumbersAnchored,
            blockInfosLength
        );
    }

    function _getAnchoringStats(
        uint256 _chainId
    )
        internal
        view
        returns (
            uint256 totalAnchors_,
            uint256 lastAnchoredBlock_,
            uint256 thisChainId_,
            uint256 anchoredChainId_
        )
    {
        thisChainId_ = _blockChainId();
        anchoredChainId_ = _chainId;
        AnchoringStorage storage $ = _anchoringStorage();
        EnumerableSet.UintSet storage registeredChainIds = $.registeredChainIds;

        if (!registeredChainIds.contains(_chainId))
            return (
                totalAnchors_,
                lastAnchoredBlock_,
                thisChainId_,
                anchoredChainId_
            );

        EnumerableSet.UintSet storage anchoredBlockNumbers = $
            .anchoredChains[_chainId]
            .anchoredBlockNumbers;
        totalAnchors_ = anchoredBlockNumbers.length();
        unchecked {
            lastAnchoredBlock_ = totalAnchors_ == 0
                ? 0
                : anchoredBlockNumbers.at(totalAnchors_ - 1);
        }
    }

    function _getChainMetadata()
        internal
        view
        returns (uint256 _thisChainId, uint256[] memory _registeredChainIds)
    {
        return (
            _blockChainId(),
            _anchoringStorage().registeredChainIds.values()
        );
    }

    function _getRegisteredChains(
        uint256 _pageIndex,
        uint256 _pageLength
    )
        internal
        view
        returns (uint256 _thisChainId, uint256[] memory _registeredChainIds)
    {
        return (
            _blockChainId(),
            _anchoringStorage().registeredChainIds.getFromSet(
                _pageIndex,
                _pageLength
            )
        );
    }

    function _checkBlockSequential(
        uint256 _chainId,
        uint256 _blockNumber
    ) internal view {
        EnumerableSet.UintSet storage anchoredBlockNumbers = _anchoringStorage()
            .anchoredChains[_chainId]
            .anchoredBlockNumbers;
        uint256 totalAnchors = anchoredBlockNumbers.length();

        if (totalAnchors == 0) return;
        unchecked {
            uint256 lastBlock = anchoredBlockNumbers.at(totalAnchors - 1);
            require(
                _blockNumber > lastBlock,
                IAnchoringCore.BlockNumberMustBeHigher(
                    _blockNumber,
                    lastBlock + 1
                )
            );
        }
    }

    function _checkRegisteredChain(uint256 _chainId) internal view {
        require(
            _isChainRegistered(_chainId),
            IAnchoringCore.ChainNotRegistered(_chainId)
        );
    }

    function _checkBlocksBatch(
        uint256 _chainId,
        uint256[] calldata _blockNumbers
    ) internal view {
        uint256 length = _blockNumbers.length;
        EnumerableSet.UintSet storage anchoredBlockNumbers = _anchoringStorage()
            .anchoredChains[_chainId]
            .anchoredBlockNumbers;

        uint256 expectedNextBlock;
        uint256 totalAnchors = anchoredBlockNumbers.length();
        unchecked {
            expectedNextBlock = totalAnchors == 0
                ? _blockNumbers[0]
                : anchoredBlockNumbers.at(totalAnchors - 1) + 1;
        }

        for (uint256 index; index < length; ) {
            uint256 blockNumber = _blockNumbers[index];
            _checkUintIsNotZero(blockNumber);
            _checkBlockNotAnchored(_chainId, blockNumber);
            _checkIncrementalBlocks(blockNumber, expectedNextBlock);
            unchecked {
                expectedNextBlock = blockNumber + 1;
                ++index;
            }
        }
    }

    function _checkBlockNotAnchored(
        uint256 _chainId,
        uint256 _blockNumber
    ) internal view {
        require(
            !_isBlockAnchored(_chainId, _blockNumber),
            IAnchoringCore.BlockAlreadyAnchored(_blockNumber)
        );
    }

    function _getBlockInfo(
        uint256 _chainId,
        uint256 _blockNumber
    ) internal view returns (BlockInfo memory) {
        return
            _anchoringStorage().anchoredChains[_chainId].blockByNumber[
                _blockNumber
            ];
    }

    function _storeAnchoredBlock(
        uint256 _chainId,
        uint256 _blockNumber,
        bytes32 _blockHash,
        bytes32 _stateRoot,
        uint256 _timestamp,
        address _anchorer
    ) private {
        ChainAnchoringData storage chainData = _anchoringStorage()
            .anchoredChains[_chainId];
        chainData.blockByNumber[_blockNumber] = _buildBlockInfo(
            _blockNumber,
            _blockHash,
            _stateRoot,
            _timestamp,
            _anchorer
        );
        chainData.anchoredBlockNumbers.add(_blockNumber);
    }

    function _checkUnregisteredChain(uint256 _chainId) private view {
        require(
            !_isChainRegistered(_chainId),
            IAnchoringCore.ChainAlreadyRegistered(_chainId)
        );
    }

    function _isChainRegistered(uint256 _chainId) private view returns (bool) {
        return _anchoringStorage().registeredChainIds.contains(_chainId);
    }

    function _buildBlockInfos(
        uint256 _chainId,
        uint256[] memory _blockNumbersAnchored,
        uint256 _blockInfosLength
    ) private view returns (BlockInfo[] memory blockInfos_) {
        blockInfos_ = new BlockInfo[](_blockInfosLength);
        for (uint256 index; index < _blockInfosLength; ) {
            blockInfos_[index] = _getBlockInfo(
                _chainId,
                _blockNumbersAnchored[index]
            );
            unchecked {
                ++index;
            }
        }
    }

    function _getBlockNumbersAnchoredInRange(
        uint256 _chainId,
        uint256 _fromBlock,
        uint256 _toBlock
    )
        private
        view
        returns (
            uint256[] memory blockNumbersAnchored_,
            uint256 blockInfosLength_
        )
    {
        ChainAnchoringData storage chainData = _anchoringStorage()
            .anchoredChains[_chainId];
        EnumerableSet.UintSet storage anchoredBlockNumbers = chainData
            .anchoredBlockNumbers;
        unchecked {
            blockNumbersAnchored_ = new uint256[](++_toBlock - _fromBlock);
        }
        for (uint256 currentBlock = _fromBlock; currentBlock < _toBlock; ) {
            if (anchoredBlockNumbers.contains(currentBlock)) {
                blockNumbersAnchored_[blockInfosLength_] = currentBlock;
                unchecked {
                    ++blockInfosLength_;
                }
            }
            unchecked {
                ++currentBlock;
            }
        }
    }

    function _checkIncrementalBlocks(
        uint256 _currentBlock,
        uint256 _expectedNextBlock
    ) private pure {
        require(
            _currentBlock >= _expectedNextBlock,
            IAnchoringCore.BlockNumberMustBeHigher(
                _currentBlock,
                _expectedNextBlock
            )
        );
    }

    function _anchoringStorage()
        private
        pure
        returns (AnchoringStorage storage storage_)
    {
        bytes32 position = _ANCHORING_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
