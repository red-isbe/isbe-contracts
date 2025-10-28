// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../../core/Common.sol';
import {_COUNTRY_WHITELISTING_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

abstract contract CountryWhitelistingInternal is Common {
    struct CountryWhitelistingStorage {
        mapping(uint16 => bool) whitelistedCountries;
    }


    function _whitelistCountry(uint16 country) internal {
        CountryWhitelistingStorage storage $ = _countryWhitelistingStorage();
        require(!$.whitelistedCountries[country], 'country already whitelisted');
        $.whitelistedCountries[country] = true;
    }

    function _unWhitelistCountry(uint16 country) internal {
        CountryWhitelistingStorage storage $ = _countryWhitelistingStorage();
        require($.whitelistedCountries[country], 'country not whitelisted');
        $.whitelistedCountries[country] = false;
    }
    
    // solhint-disable no-empty-blocks
    function _transferred(address, address, uint256) internal virtual {}
    // solhint-disable no-empty-blocks
    function _created(address, uint256) internal virtual {}
    // solhint-disable no-empty-blocks
    function _destroyed(address, uint256) internal virtual {}

    function _isCountryWhitelisted(uint16 country) internal view returns (bool) {
        return _countryWhitelistingStorage().whitelistedCountries[country];
    }

    function _canTransfer(address /*from*/, address /*to*/, uint256 /*amount*/) internal view returns (bool) {
        //uint16 receiverCountry = _getCountry(to);
        uint16 receiverCountry = 724; // Spain country code as example
        return _isCountryWhitelisted(receiverCountry);
    }

    function _countryWhitelistingStorage()
        private
        pure
        returns (CountryWhitelistingStorage storage storage_)
    {
        bytes32 position = _COUNTRY_WHITELISTING_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}