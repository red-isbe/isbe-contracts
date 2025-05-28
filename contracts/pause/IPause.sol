// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IPause {
    event Paused(address account);

    event Unpaused(address account);

    error InsufficientAuthorityLevel(
        uint256 authorityLevel,
        uint256 requiredAuthorityLevel
    );
    error IsPaused();
    error IsNotPaused();

    function pause() external;

    function unpause() external;

    function paused() external view returns (bool);
}
