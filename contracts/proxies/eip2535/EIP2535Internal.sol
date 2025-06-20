// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IDiamondLoupe} from './interfaces/IDiamondLoupe.sol';
import {IDiamondCut} from './interfaces/IDiamondCut.sol';
import {IDiamond} from './interfaces/IDiamond.sol';
import {IEIP2535Introspection} from './interfaces/IEIP2535Introspection.sol';
import {_DIAMOND_STORAGE_POSITION} from '../../constants/storagePositions.sol';
import {Common} from '../../core/Common.sol';

// solhint-disable no-inline-assembly
/**
 * @title EIP2535Internal Abstract Contract
 * @dev Provides internal functions and structures to manage the facets and function selectors of a diamond
 *      contract. Implements the core operations related to the EIP-2535 Diamond Standard, such as adding,
 *      replacing, or removing functions. Contains detailed error handling for various edge cases during
 *      diamond modification and management.
 */
abstract contract EIP2535Internal is Common {
    /**
     * @dev Struct to store the facet address and its selector position for a given selector.
     * @param facetAddress The address of the facet that implements the function.
     * @param selectorPosition The position of the selector in the array of selectors for the facet.
     */
    /* struct FacetAddressAndSelectorPosition {
        address facetAddress;
        uint16 selectorPosition;
    }

    struct FacetAddressAndInterfacePosition {
        address facetAddress;
        uint16 interfacePosition;
    }*/

    struct FacetAddressAndItemPosition {
        address facetAddress;
        uint16 itemPosition;
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
        mapping(bytes4 => FacetAddressAndItemPosition) facetAddressAndSelectorPosition;
        bytes4[] selectors;
        mapping(bytes4 => FacetAddressAndItemPosition) facetAddressAndInterfacePosition;
        bytes4[] interfaces;
    }

    error NoBytecodeAtAddress(address _contractAddress, string _message);
    error RemoveFacetAddressMustBeZeroAddress(address _facetAddress);
    error InitializationFunctionReverted(
        address _initializationContractAddress,
        bytes _calldata
    );

    error NoItemsProvidedForUpdate(address _facetAddress);
    error ZeroItem(address facetAddress, uint256 position);
    error CannotAddItemsToZeroAddress(bytes4[] _items);
    error CannotAddItemToDiamondThatAlreadyExists(bytes4 _items);
    error CannotReplaceItemsFromFacetWithZeroAddress(bytes4[] _items);
    error CannotReplaceImmutableItems(bytes4 _item);
    error CannotReplaceItemWithTheSameItemFromTheSameFacet(bytes4 _item);
    error CannotReplaceItemThatDoesNotExists(bytes4 _item);
    error CannotRemoveItemThatDoesNotExist(bytes4 _item);
    error CannotRemoveImmutableItem(bytes4 _item);

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
        IDiamondCut.ItemCut[] memory _facetCuts,
        address _init,
        bytes memory _calldata
    ) internal {
        DiamondStorage storage $ = _diamondStorage();

        _itemCut(_facetCuts, $.facetAddressAndSelectorPosition, $.selectors);

        emit IDiamond.DiamondCut(_facetCuts, _init, _calldata);
        _initializeDiamondCut(_init, _calldata);
    }

    function _interfaceCut(
        IDiamondCut.ItemCut[] memory _interfaceCuts
    ) internal {
        DiamondStorage storage $ = _diamondStorage();

        _itemCut(
            _interfaceCuts,
            $.facetAddressAndInterfacePosition,
            $.interfaces
        );

        emit IDiamond.InterfacesUpdate(_interfaceCuts);
    }

    function _itemCut(
        IDiamondCut.ItemCut[] memory _itemCuts,
        mapping(bytes4 => FacetAddressAndItemPosition) storage _facetAddressAndItemPosition,
        bytes4[] storage _items
    ) internal {
        uint256 length = _itemCuts.length;

        for (uint256 itemIndex; itemIndex < length; ) {
            bytes4[] memory items = _itemCuts[itemIndex].items;
            address facetAddress = _itemCuts[itemIndex].facetAddress;

            if (items.length == 0) {
                revert NoItemsProvidedForUpdate(facetAddress);
            }
            _checkNonZeroItem(facetAddress, items);

            IDiamondCut.ItemCutAction action = _itemCuts[itemIndex].action;
            unchecked {
                ++itemIndex;
            }
            if (action == IDiamond.ItemCutAction.Add) {
                _addItems(
                    facetAddress,
                    items,
                    _facetAddressAndItemPosition,
                    _items
                );
                continue;
            }
            if (action == IDiamond.ItemCutAction.Replace) {
                _replaceItems(
                    facetAddress,
                    items,
                    _facetAddressAndItemPosition
                );
                continue;
            }
            _removeItems(
                facetAddress,
                items,
                _facetAddressAndItemPosition,
                _items
            );
        }
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
        DiamondStorage storage $ = _diamondStorage();

        _removeAllItems($.facetAddressAndSelectorPosition, $.selectors);
        _removeAllItems($.facetAddressAndInterfacePosition, $.interfaces);
        _configureFacets(_newFacetAddresses, _init, _calldata);
    }

    function _configureFacets(
        address[] memory _newFacetAddresses,
        address _init,
        bytes memory _calldata
    ) internal {
        _diamondCut(
            _buildItemUpdatesFromIntrospection(
                _newFacetAddresses,
                IDiamond.ItemsType.Selectors
            ),
            _init,
            _calldata
        );
        _interfaceCut(
            _buildItemUpdatesFromIntrospection(
                _newFacetAddresses,
                IDiamond.ItemsType.Interfaces
            )
        );
    }

    function _addItems(
        address _newFacetAddress,
        bytes4[] memory _newItems,
        mapping(bytes4 => FacetAddressAndItemPosition) storage _facetAddressAndItemPosition,
        bytes4[] storage _items
    ) internal {
        if (_newFacetAddress == address(0)) {
            revert CannotAddItemsToZeroAddress(_newItems);
        }

        uint16 itemCount = uint16(_items.length);
        _enforceHasContractCode(
            _newFacetAddress,
            'LibDiamondCut: Add facet has no code'
        );

        uint256 length = _newItems.length;
        for (uint256 itemIndex; itemIndex < length; itemIndex++) {
            bytes4 item = _newItems[itemIndex];
            address oldFacetAddress = _facetAddressAndItemPosition[item]
                .facetAddress;
            if (oldFacetAddress != address(0)) {
                revert CannotAddItemToDiamondThatAlreadyExists(item);
            }
            _facetAddressAndItemPosition[item] = FacetAddressAndItemPosition(
                _newFacetAddress,
                itemCount
            );
            _items.push(item);
            unchecked {
                ++itemCount;
            }
        }
    }

    function _replaceItems(
        address _newFacetAddress,
        bytes4[] memory _items,
        mapping(bytes4 => FacetAddressAndItemPosition) storage _facetAddressAndItemPosition
    ) internal {
        if (_newFacetAddress == address(0)) {
            revert CannotReplaceItemsFromFacetWithZeroAddress(_items);
        }

        _enforceHasContractCode(
            _newFacetAddress,
            'LibDiamondCut: Replace facet has no code'
        );

        for (uint256 itemIndex; itemIndex < _items.length; ) {
            bytes4 item = _items[itemIndex];
            address oldFacetAddress = _facetAddressAndItemPosition[item]
                .facetAddress;
            // can't replace immutable functions -- functions defined directly in the diamond in this case
            if (oldFacetAddress == address(this)) {
                revert CannotReplaceImmutableItems(item);
            }
            if (oldFacetAddress == _newFacetAddress) {
                revert CannotReplaceItemWithTheSameItemFromTheSameFacet(item);
            }
            if (oldFacetAddress == address(0)) {
                revert CannotReplaceItemThatDoesNotExists(item);
            }
            // replace old facet address
            _facetAddressAndItemPosition[item].facetAddress = _newFacetAddress;
            unchecked {
                ++itemIndex;
            }
        }
    }

    function _removeItems(
        address _emptyAddress,
        bytes4[] memory _oldItems,
        mapping(bytes4 => FacetAddressAndItemPosition) storage _facetAddressAndItemPosition,
        bytes4[] storage _items
    ) internal {
        uint256 itemCount = _items.length;
        if (_emptyAddress != address(0)) {
            revert RemoveFacetAddressMustBeZeroAddress(_emptyAddress);
        }
        uint256 length = _oldItems.length;
        for (uint256 itemIndex; itemIndex < length; ) {
            bytes4 item = _oldItems[itemIndex];
            FacetAddressAndItemPosition
                memory oldFacetAddressAndItemPosition = _facetAddressAndItemPosition[
                    item
                ];
            if (oldFacetAddressAndItemPosition.facetAddress == address(0)) {
                revert CannotRemoveItemThatDoesNotExist(item);
            }

            // can't remove immutable Item -- Item defined directly in the diamond
            if (oldFacetAddressAndItemPosition.facetAddress == address(this)) {
                revert CannotRemoveImmutableItem(item);
            }
            // replace Item with last Item
            unchecked {
                --itemCount;
            }
            if (oldFacetAddressAndItemPosition.itemPosition != itemCount) {
                bytes4 lastItem = _items[itemCount];
                _items[oldFacetAddressAndItemPosition.itemPosition] = lastItem;
                _facetAddressAndItemPosition[lastItem]
                    .itemPosition = oldFacetAddressAndItemPosition.itemPosition;
            }
            // delete last item
            _items.pop();
            delete _facetAddressAndItemPosition[item];
            unchecked {
                ++itemIndex;
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
        // solhint-disable avoid-low-level-calls
        // slither-disable-next-line controlled-delegatecall
        (bool success, bytes memory error) = _init.delegatecall(_calldata);
        // solhint-enable avoid-low-level-calls
        if (success) {
            return;
        }
        if (error.length == 0) {
            revert InitializationFunctionReverted(_init, _calldata);
        }
        // bubble up error
        /// @solidity memory-safe-assembly
        assembly {
            let returndata_size := mload(error)
            revert(add(32, error), returndata_size)
        }
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
        bytes4 interfaceId
    ) internal view virtual returns (bool) {
        DiamondStorage storage $ = _diamondStorage();
        return
            $.facetAddressAndInterfacePosition[interfaceId].facetAddress !=
            address(0);
    }

    function _removeAllItems(
        mapping(bytes4 => FacetAddressAndItemPosition) storage _facetAddressAndItemPosition,
        bytes4[] storage _items
    ) private {
        uint256 itemsLength = _items.length;
        FacetAddressAndItemPosition memory empty;

        for (uint256 index; index < itemsLength; ) {
            unchecked {
                ++index;
            }
            _facetAddressAndItemPosition[_items[itemsLength - index]] = empty;
            _items.pop();
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

    function _buildItemUpdatesFromIntrospection(
        address[] memory facetAddresses,
        IDiamond.ItemsType itemType
    ) private pure returns (IDiamondCut.ItemCut[] memory itemCut) {
        uint256 facetAddressesLength = facetAddresses.length;
        itemCut = new IDiamondCut.ItemCut[](facetAddressesLength);
        for (uint256 index; index < facetAddressesLength; ++index) {
            itemCut[index] = IDiamond.ItemCut({
                facetAddress: facetAddresses[index],
                action: IDiamond.ItemCutAction.Add,
                items: _introspectItems(facetAddresses[index], itemType)
            });
            _checkNonZeroItem(facetAddresses[index], itemCut[index].items);
        }
    }

    function _introspectItems(
        address facetAddress,
        IDiamond.ItemsType itemType
    ) private pure returns (bytes4[] memory items) {
        if (itemType == IDiamond.ItemsType.Selectors) {
            items = IEIP2535Introspection(facetAddress)
                .selectorsIntrospection();
        } else {
            items = IEIP2535Introspection(facetAddress)
                .interfacesIntrospection();
        }
    }

    function _checkNonZeroItem(
        address _address,
        bytes4[] memory _items
    ) private pure {
        uint256 length = _items.length;
        for (uint256 index; index < length; ++index) {
            require(_items[index] != bytes4(0), ZeroItem(_address, index));
        }
    }
}
// solhint-enable no-inline-assembly
