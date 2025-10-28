// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ICountryRestrictions {
    function addCountryRestriction(uint16 country) external;
    function removeCountryRestriction(uint16 country) external;
    function isCountryRestricted(uint16 country) external view returns (bool);
}