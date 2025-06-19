// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {InitializeBusinessLogic} from '../../utils/InitializeBusinessLogic.sol';
import {Common} from '../../core/Common.sol';
import {IDiamondCut} from './interfaces/IDiamondCut.sol';
import {IDiamondLoupe} from './interfaces/IDiamondLoupe.sol';
import {IDiamond} from './interfaces/IDiamond.sol';
import {IEIP2535Introspection} from './interfaces/IEIP2535Introspection.sol';
import {_DIAMOND_STORAGE_POSITION} from '../../constants/storagePositions.sol';

// solhint-disable no-inline-assembly
/**
 * @title EIP2535Internal Abstract Contract
 * @dev Provides internal functions and structures to manage the facets and function selectors of a diamond
 *      contract. Implements the core operations related to the EIP-2535 Diamond Standard, such as adding,
 *      replacing, or removing functions. Contains detailed error handling for various edge cases during
 *      diamond modification and management.
 */
abstract contract EIP2535Internal is Common, InitializeBusinessLogic {
    /**
     * @dev Struct to store the facet address and its selector position for a given selector.
     * @param facetAddress The address of the facet that implements the function.
     * @param selectorPosition The position of the selector in the array of selectors for the facet.
     */
    struct FacetAddressAndSelectorPosition {
        address facetAddress;
        uint16 selectorPosition;
    }

    /**
     * @dev Struct storing the data necessary for managing facet addresses and selectors.
     * @param facetAddressAndSelectorPosition Maps function selectors (`bytes4`) to their corresponding facet address
     *        and selector position.
     * @param selectors An array of all function selectors currently associated with the diamond.
     * @param supportedInterfaces A mapping of interface IDs (`bytes4`) to boolean values indicating their support
     *        status.
     */
    struct DiamondStorage {
        // function selector => facet address and selector position in selectors array
        mapping(bytes4 => FacetAddressAndSelectorPosition) facetAddressAndSelectorPosition;
        bytes4[] selectors;
        mapping(bytes4 => bool) supportedInterfaces;
    }

    error NoSelectorsGivenToAdd();
    error NotContractOwner(address _user, address _contractOwner);
    error NoSelectorsProvidedForFacetForCut(address _facetAddress);
    error CannotAddSelectorsToZeroAddress(bytes4[] _selectors);
    error NoBytecodeAtAddress(address _contractAddress, string _message);
    error IncorrectFacetCutAction(uint8 _action);
    error CannotAddFunctionToDiamondThatAlreadyExists(bytes4 _selector);
    error CannotReplaceFunctionsFromFacetWithZeroAddress(bytes4[] _selectors);
    error CannotReplaceImmutableFunction(bytes4 _selector);
    error CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet(
        bytes4 _selector
    );
    error CannotReplaceFunctionThatDoesNotExists(bytes4 _selector);
    error RemoveFacetAddressMustBeZeroAddress(address _facetAddress);
    error CannotRemoveFunctionThatDoesNotExist(bytes4 _selector);
    error CannotRemoveImmutableFunction(bytes4 _selector);
    error ZeroSelector(address facetAddress, uint256 position);

    /**
     * @notice Modifies the diamond by applying the given facet cuts.
     * @dev This is the internal version of the `diamondCut` function. It processes the addition, replacement, or
     *      removal of function selectors associated with facets, as specified in the `_facetCuts` parameter. Once
     *      changes are applied, the optional initialization function specified by `_init` and `_calldata` is executed.
     * @param _facetCuts The set of changes to apply to the diamond (add, replace, or remove selectors).
     * @param _init The address of the initialization contract.
     * @param _calldata The calldata to execute during initialization.
     */
    function _diamondCut(
        IDiamondCut.FacetCut[] memory _facetCuts,
        address _init,
        bytes memory _calldata
    ) internal {
        uint256 length = _facetCuts.length;
        for (uint256 facetIndex; facetIndex < length; ) {
            bytes4[] memory functionSelectors = _facetCuts[facetIndex]
                .functionSelectors;
            address facetAddress = _facetCuts[facetIndex].facetAddress;
            if (functionSelectors.length == 0) {
                revert NoSelectorsProvidedForFacetForCut(facetAddress);
            }
            _checkNonZeroSelector(facetAddress, functionSelectors);
            IDiamondCut.FacetCutAction action = _facetCuts[facetIndex].action;
            unchecked {
                ++facetIndex;
            }
            if (action == IDiamond.FacetCutAction.Add) {
                _addFunctions(facetAddress, functionSelectors);
                continue;
            }
            if (action == IDiamond.FacetCutAction.Replace) {
                _replaceFunctions(facetAddress, functionSelectors);
                continue;
            }
            _removeFunctions(facetAddress, functionSelectors);
        }
        emit IDiamond.DiamondCut(_facetCuts, _init, _calldata);
        _initializeDiamondCut(_init, _calldata);
    }

    /**
     * @notice Reconfigures the diamond by removing all existing selectors and setting up new facets.
     * @dev Removes all selectors from the diamond and applies configuration for the given `_newFacetAddresses`.
     *      Executes an optional initialization function specified by `_init` and `_calldata`.
     * @param _newFacetAddresses The new set of facet addresses to configure for the diamond.
     * @param _init The address of the initialization contract.
     * @param _calldata The calldata to execute during initialization.
     */
    function _facetUpdates(
        address[] memory _newFacetAddresses,
        address _init,
        bytes calldata _calldata
    ) internal {
        _removeAllSelectors();
        _configureFacets(_newFacetAddresses, _init, _calldata);
    }

    function _configureFacets(
        address[] memory _newFacetAddresses,
        address _init,
        bytes memory _calldata
    ) internal {
        _diamondCut(
            _buildFacetCutsFromIntrospection(_newFacetAddresses),
            _init,
            _calldata
        );
    }

    function _addFunctions(
        address _newFacetAddress,
        bytes4[] memory _functionSelectors
    ) internal {
        if (_newFacetAddress == address(0)) {
            revert CannotAddSelectorsToZeroAddress(_functionSelectors);
        }
        DiamondStorage storage $ = _diamondStorage();
        uint16 selectorCount = uint16($.selectors.length);
        _enforceHasContractCode(
            _newFacetAddress,
            'LibDiamondCut: Add facet has no code'
        );
        uint256 length = _functionSelectors.length;
        for (uint256 selectorIndex; selectorIndex < length; ) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = $
                .facetAddressAndSelectorPosition[selector]
                .facetAddress;
            if (oldFacetAddress != address(0)) {
                revert CannotAddFunctionToDiamondThatAlreadyExists(selector);
            }
            $.facetAddressAndSelectorPosition[
                selector
            ] = FacetAddressAndSelectorPosition(
                _newFacetAddress,
                selectorCount
            );
            $.selectors.push(selector);
            unchecked {
                ++selectorCount;
                ++selectorIndex;
            }
        }
    }

    function _replaceFunctions(
        address _newFacetAddress,
        bytes4[] memory _functionSelectors
    ) internal {
        DiamondStorage storage $ = _diamondStorage();
        if (_newFacetAddress == address(0)) {
            revert CannotReplaceFunctionsFromFacetWithZeroAddress(
                _functionSelectors
            );
        }
        _enforceHasContractCode(
            _newFacetAddress,
            'LibDiamondCut: Replace facet has no code'
        );
        for (
            uint256 selectorIndex;
            selectorIndex < _functionSelectors.length;

        ) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = $
                .facetAddressAndSelectorPosition[selector]
                .facetAddress;
            // can't replace immutable functions -- functions defined directly in the diamond in this case
            if (oldFacetAddress == address(this)) {
                revert CannotReplaceImmutableFunction(selector);
            }
            if (oldFacetAddress == _newFacetAddress) {
                revert CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet(
                    selector
                );
            }
            if (oldFacetAddress == address(0)) {
                revert CannotReplaceFunctionThatDoesNotExists(selector);
            }
            // replace old facet address
            $
                .facetAddressAndSelectorPosition[selector]
                .facetAddress = _newFacetAddress;
            unchecked {
                ++selectorIndex;
            }
        }
    }

    function _removeFunctions(
        address _emptyAddress,
        bytes4[] memory _functionSelectors
    ) internal {
        DiamondStorage storage $ = _diamondStorage();
        uint256 selectorCount = $.selectors.length;
        if (_emptyAddress != address(0)) {
            revert RemoveFacetAddressMustBeZeroAddress(_emptyAddress);
        }
        uint256 length = _functionSelectors.length;
        for (uint256 selectorIndex; selectorIndex < length; ) {
            bytes4 selector = _functionSelectors[selectorIndex];
            FacetAddressAndSelectorPosition
                memory oldFacetAddressAndSelectorPosition = $
                    .facetAddressAndSelectorPosition[selector];
            if (oldFacetAddressAndSelectorPosition.facetAddress == address(0)) {
                revert CannotRemoveFunctionThatDoesNotExist(selector);
            }

            // can't remove immutable functions -- functions defined directly in the diamond
            if (
                oldFacetAddressAndSelectorPosition.facetAddress == address(this)
            ) {
                revert CannotRemoveImmutableFunction(selector);
            }
            // replace selector with last selector
            unchecked {
                --selectorCount;
            }
            if (
                oldFacetAddressAndSelectorPosition.selectorPosition !=
                selectorCount
            ) {
                bytes4 lastSelector = $.selectors[selectorCount];
                $.selectors[
                    oldFacetAddressAndSelectorPosition.selectorPosition
                ] = lastSelector;
                $
                    .facetAddressAndSelectorPosition[lastSelector]
                    .selectorPosition = oldFacetAddressAndSelectorPosition
                    .selectorPosition;
            }
            // delete last selector
            $.selectors.pop();
            delete $.facetAddressAndSelectorPosition[selector];
            unchecked {
                ++selectorIndex;
            }
        }
    }

    function _initializeDiamondCut(
        address _init,
        bytes memory _calldata
    ) internal {
        if (_init == address(0)) {
            return;
        }
        _enforceHasContractCode(
            _init,
            'LibDiamondCut: _init address has no code'
        );
        _initializeBusinessLogic(_init, _calldata);
    }

    function _enforceHasContractCode(
        address _contract,
        string memory _errorMessage
    ) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        if (contractSize == 0) {
            revert NoBytecodeAtAddress(_contract, _errorMessage);
        }
    }

    function _facets()
        internal
        view
        returns (IDiamondLoupe.Facet[] memory facets_)
    {
        DiamondStorage storage $ = _diamondStorage();
        uint256 selectorCount = $.selectors.length;
        // create an array set to the maximum size possible
        facets_ = new IDiamondLoupe.Facet[](selectorCount);
        // create an array for counting the number of selectors for each facet
        uint16[] memory numFacetSelectors = new uint16[](selectorCount);
        // total number of facets
        uint256 numFacets;
        // loop through function selectors
        for (
            uint256 selectorIndex;
            selectorIndex < selectorCount;
            ++selectorIndex
        ) {
            bytes4 selector = $.selectors[selectorIndex];
            address facetAddress_ = $
                .facetAddressAndSelectorPosition[selector]
                .facetAddress;
            bool continueLoop;
            // find the functionSelectors array for selector and add selector to it
            for (uint256 facetIndex; facetIndex < numFacets; ++facetIndex) {
                if (facets_[facetIndex].facetAddress == facetAddress_) {
                    facets_[facetIndex].functionSelectors[
                        numFacetSelectors[facetIndex]
                    ] = selector;
                    unchecked {
                        ++numFacetSelectors[facetIndex];
                    }
                    continueLoop = true;
                    break;
                }
            }
            // if functionSelectors array exists for selector then continue loop
            if (continueLoop) {
                continue;
            }
            // create a new functionSelectors array for selector
            facets_[numFacets] = IDiamondLoupe.Facet({
                facetAddress: facetAddress_,
                functionSelectors: new bytes4[](selectorCount)
            });
            facets_[numFacets].functionSelectors[0] = selector;
            numFacetSelectors[numFacets] = 1;
            unchecked {
                ++numFacets;
            }
        }
        for (uint256 facetIndex; facetIndex < numFacets; ) {
            uint256 numSelectors = numFacetSelectors[facetIndex];
            bytes4[] memory selectors = facets_[facetIndex].functionSelectors;
            // setting the number of selectors
            assembly {
                mstore(selectors, numSelectors)
            }
            unchecked {
                ++facetIndex;
            }
        }
        // setting the number of facets
        assembly {
            mstore(facets_, numFacets)
        }
    }

    function _facetFunctionSelectors(
        address _facet
    ) internal view returns (bytes4[] memory functionSelectors_) {
        DiamondStorage storage $ = _diamondStorage();
        uint256 selectorCount = $.selectors.length;
        uint256 numSelectors;
        functionSelectors_ = new bytes4[](selectorCount);
        // loop through function selectors
        for (uint256 selectorIndex; selectorIndex < selectorCount; ) {
            bytes4 selector = $.selectors[selectorIndex];
            address facetAddress_ = $
                .facetAddressAndSelectorPosition[selector]
                .facetAddress;
            if (_facet == facetAddress_) {
                functionSelectors_[numSelectors] = selector;
                unchecked {
                    ++numSelectors;
                }
            }
            unchecked {
                ++selectorIndex;
            }
        }
        // Set the number of selectors in the array
        assembly {
            mstore(functionSelectors_, numSelectors)
        }
    }

    function _facetAddresses()
        internal
        view
        returns (address[] memory facetAddresses_)
    {
        DiamondStorage storage $ = _diamondStorage();
        uint256 selectorCount = $.selectors.length;
        // create an array set to the maximum size possible
        facetAddresses_ = new address[](selectorCount);
        uint256 numFacets;
        // loop through function selectors
        for (
            uint256 selectorIndex;
            selectorIndex < selectorCount;
            ++selectorIndex
        ) {
            address facetAddress_ = $
                .facetAddressAndSelectorPosition[$.selectors[selectorIndex]]
                .facetAddress;
            bool continueLoop;
            // see if we have collected the address already and break out of loop if we have
            for (uint256 facetIndex; facetIndex < numFacets; ++facetIndex) {
                if (facetAddress_ == facetAddresses_[facetIndex]) {
                    continueLoop = true;
                    break;
                }
            }
            // continue loop if we already have the address
            if (continueLoop) {
                continue;
            }
            // include address
            facetAddresses_[numFacets] = facetAddress_;
            unchecked {
                ++numFacets;
            }
        }
        // Set the number of facet addresses in the array
        assembly {
            mstore(facetAddresses_, numFacets)
        }
    }

    function _facetAddress(bytes4 _signature) internal view returns (address) {
        return
            _diamondStorage()
                .facetAddressAndSelectorPosition[_signature]
                .facetAddress;
    }
    function _supportsInterface(
        bytes4 _interfaceId
    ) internal view returns (bool) {
        return _diamondStorage().supportedInterfaces[_interfaceId];
    }

    function _removeAllSelectors() private {
        DiamondStorage storage $ = _diamondStorage();
        uint256 selectorsLength = $.selectors.length;
        FacetAddressAndSelectorPosition memory empty;
        for (uint256 index; index < selectorsLength; ) {
            unchecked {
                ++index;
            }
            $.facetAddressAndSelectorPosition[
                $.selectors[selectorsLength - index]
            ] = empty;
            $.selectors.pop();
        }
    }

    function _diamondStorage()
        private
        pure
        returns (DiamondStorage storage storage_)
    {
        bytes32 position = _DIAMOND_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }

    function _buildFacetCutsFromIntrospection(
        address[] memory facetAddresses
    ) private pure returns (IDiamondCut.FacetCut[] memory diamondCut) {
        uint256 facetAddressesLength = facetAddresses.length;
        diamondCut = new IDiamondCut.FacetCut[](facetAddressesLength);
        for (uint256 index; index < facetAddressesLength; ++index) {
            diamondCut[index] = IDiamond.FacetCut({
                facetAddress: facetAddresses[index],
                action: IDiamond.FacetCutAction.Add,
                functionSelectors: IEIP2535Introspection(facetAddresses[index])
                    .selectorsIntrospection()
            });
            _checkNonZeroSelector(
                facetAddresses[index],
                diamondCut[index].functionSelectors
            );
        }
    }

    function _checkNonZeroSelector(
        address facetAddress,
        bytes4[] memory selectors
    ) private pure {
        uint256 length = selectors.length;
        for (uint256 index; index < length; ++index) {
            require(
                selectors[index] != bytes4(0),
                ZeroSelector(facetAddress, index)
            );
        }
    }
}
// solhint-enable no-inline-assembly
