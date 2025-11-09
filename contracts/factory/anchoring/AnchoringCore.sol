// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AnchoringCoreInternal} from './AnchoringCoreInternal.sol';
import {IAnchoringCore, BlockInfo} from './IAnchoringCore.sol';
import {
    _ANCHORER_ROLE,
    _METADATA_MANAGER_ROLE
} from '../../constants/roles.sol';

/**
 * @title AnchoringCore
 * @author ISBE Team
 * @notice Manages cross-chain block anchoring with multi-chain support
 * @dev This contract serves as the public-facing entry point for anchoring
 *      block metadata from external blockchains. It implements the `IAnchoringCore`
 *      interface and inherits core anchoring logic from `AnchoringCoreInternal`.
 *      Access to state-changing functions is restricted by role-based access control.
 */
abstract contract AnchoringCore is AnchoringCoreInternal, IAnchoringCore {
    function registerChain(
        uint256 _chainId
    )
        external
        override
        emptyUint(_chainId)
        onlyRole(_METADATA_MANAGER_ROLE)
        whenNotPaused
        onlyUnregisteredChain(_chainId)
    {
        _registerChain(_chainId);
        emit IAnchoringCore.ChainRegistered(_chainId, _msgSender());
    }

    function anchorBlock(
        uint256 _chainId,
        uint256 _blockNumber,
        bytes32 _blockHash,
        bytes32 _stateRoot
    )
        external
        override
        onlyRole(_ANCHORER_ROLE)
        whenNotPaused
        onlyRegisteredChain(_chainId)
    {
        {
            _checkUintIsNotZero(_chainId);
            _checkBytes32IsNotZero(_blockHash);
            _checkBytes32IsNotZero(_stateRoot);
            _checkBlockNotAnchored(_chainId, _blockNumber);
            _checkBlockSequential(_chainId, _blockNumber);
        }

        address anchorer = _msgSender();
        emit IAnchoringCore.BlockAnchored(
            _blockNumber,
            _blockHash,
            _stateRoot,
            _chainId,
            _anchorBlock(
                _chainId,
                _blockNumber,
                _blockHash,
                _stateRoot,
                anchorer
            ),
            anchorer
        );
    }

    function anchorBlocksBatch(
        uint256 _chainId,
        uint256[] calldata _blockNumbers,
        bytes32[] calldata _blockHashes,
        bytes32[] calldata _stateRoots
    ) external override onlyRole(_ANCHORER_ROLE) whenNotPaused {
        uint256 length = _checkValidBatch(
            _chainId,
            _blockNumbers,
            _blockHashes,
            _stateRoots
        );
        address anchorer = _msgSender();
        uint256 timestamp = _anchorBlocksBatchInternal(
            _chainId,
            _blockNumbers,
            _blockHashes,
            _stateRoots,
            length,
            anchorer
        );
        unchecked {
            emit IAnchoringCore.BlocksBatchAnchored(
                _chainId,
                length,
                _blockNumbers[0],
                _blockNumbers[length - 1],
                timestamp,
                anchorer
            );
        }
    }

    function getLastAnchoredBlock(
        uint256 _chainId
    ) external view override returns (BlockInfo memory) {
        return _getLastAnchoredBlock(_chainId);
    }

    function getAnchoredBlock(
        uint256 _chainId,
        uint256 _blockNumber
    ) external view override returns (BlockInfo memory) {
        return _getAnchoredBlock(_chainId, _blockNumber);
    }

    function isBlockAnchored(
        uint256 _chainId,
        uint256 _blockNumber
    ) external view override returns (bool) {
        return _isBlockAnchored(_chainId, _blockNumber);
    }

    function getLastNBlocks(
        uint256 _chainId,
        uint256 _count
    ) external view override returns (BlockInfo[] memory) {
        return _getLastNBlocks(_chainId, _count);
    }

    function getBlocksInRange(
        uint256 _chainId,
        uint256 _fromBlock,
        uint256 _toBlock
    ) external view override returns (BlockInfo[] memory) {
        return _getBlocksInRange(_chainId, _fromBlock, _toBlock);
    }

    function getAnchoringStats(
        uint256 _chainId
    )
        external
        view
        override
        returns (
            uint256 _totalAnchors,
            uint256 _lastAnchoredBlock,
            uint256 _thisChainId,
            uint256 _anchoredChainId
        )
    {
        return _getAnchoringStats(_chainId);
    }

    function getChainMetadata()
        external
        view
        override
        returns (uint256 _thisChainId, uint256[] memory _registeredChainIds)
    {
        return _getChainMetadata();
    }

    function getRegisteredChains(
        uint256 _pageIndex,
        uint256 _pageLength
    )
        external
        view
        override
        returns (uint256 _thisChainId, uint256[] memory _registeredChainIds)
    {
        return _getRegisteredChains(_pageIndex, _pageLength);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IAnchoringCore).interfaceId;
    }

    function _checkValidBatch(
        uint256 _chainId,
        uint256[] calldata _blockNumbers,
        bytes32[] calldata _blockHashes,
        bytes32[] calldata _stateRoots
    ) private view returns (uint256 length_) {
        length_ = _blockNumbers.length;
        _checkUintIsNotZero(_chainId);
        _checkRegisteredChain(_chainId);
        _checkUintIsNotZero(length_);
        _checkSameLength(length_, _blockHashes.length);
        _checkSameLength(length_, _stateRoots.length);
        _checkBytes32ArrayIsNotZero(_blockHashes);
        _checkBytes32ArrayIsNotZero(_stateRoots);
        _checkBlocksBatch(_chainId, _blockNumbers);
    }
}
