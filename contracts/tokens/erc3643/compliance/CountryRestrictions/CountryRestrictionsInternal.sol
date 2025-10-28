// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Common} from '../../../../core/Common.sol';
import {_COUNTRY_RESTRICTIONS_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';

/**
 * @title CountryRestrictionsInternal
 * @notice Lógica interna para la restricción de países en compliance ERC3643.
 */
abstract contract CountryRestrictionsInternal is Common {
    struct CountryRestrictionsStorage {
        mapping(uint16 => bool) restrictedCountries;
    }

    function _addCountryRestriction(uint16 country) internal {
        CountryRestrictionsStorage storage $ = _countryRestrictionsStorage();
        require(!$.restrictedCountries[country], 'country already restricted');
        $.restrictedCountries[country] = true;
        
    }

    function _removeCountryRestriction(uint16 country) internal {
        CountryRestrictionsStorage storage $ = _countryRestrictionsStorage();
        require($.restrictedCountries[country], 'country not restricted');
        $.restrictedCountries[country] = false;
        
    }

    // solhint-disable no-empty-blocks
    function _transferred(address, address, uint256) internal virtual {}
    // solhint-disable no-empty-blocks
    function _created(address, uint256) internal virtual {}
    // solhint-disable no-empty-blocks
    function _destroyed(address, uint256) internal virtual {}

    function _canTransfer(address /*from*/, address /*to*/, uint256 /*amount*/) internal view returns (bool) {
        //uint16 receiverCountry = _getCountry(to);
        uint16 receiverCountry = 724; // Spain country code as example
        return !_isCountryRestricted(receiverCountry);
    }

    function _isCountryRestricted(uint16 country) internal view returns (bool) {
        return _countryRestrictionsStorage().restrictedCountries[country];
    }

    function _countryRestrictionsStorage()
        private
        pure
        returns (CountryRestrictionsStorage storage storage_)
    {
        bytes32 position = _COUNTRY_RESTRICTIONS_STORAGE_POSITION;
        assembly {
            storage_.slot := position
        }
    }
}