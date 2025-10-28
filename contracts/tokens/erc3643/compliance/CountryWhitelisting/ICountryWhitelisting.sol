// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title ICountryWhitelisting
 * @notice Interfaz administrativa para la gestión de países permitidos (whitelist).
 */
interface ICountryWhitelisting {
    function whitelistCountry(uint16 country) external;
    function unWhitelistCountry(uint16 country) external;
    function isCountryWhitelisted(uint16 country) external view returns (bool);
}