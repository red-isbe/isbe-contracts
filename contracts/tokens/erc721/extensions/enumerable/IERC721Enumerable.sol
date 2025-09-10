// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IERC721Enumerable
 * @notice Interface for ERC721 contracts with enumerable extension.
 *         Enables enumeration of all tokens and tokens owned by a specific account.
 * @dev Provides mechanisms to:
 *      - Retrieve the total supply of tokens.
 *      - Enumerate tokens by global index.
 *      - Enumerate tokens owned by an account by index.
 *      This interface should be implemented by ERC721 contracts that require token enumeration.
 */
interface IERC721Enumerable {
    /**
     * @notice Error thrown when the owner index is out of bounds.
     */
    error OwnerIndexOutOfBounds();

    /**
     * @notice Error thrown when the global index is out of bounds.
     */
    error GlobalIndexOutOfBounds();

    /**
     * @notice Returns the total amount of tokens stored by the contract.
     * @dev Useful for external interfaces and off-chain applications.
     * @return The total number of tokens.
     */
    function totalSupplyEnumerable() external view returns (uint256);

    /**
     * @notice Returns a token ID owned by `owner` at a given `index` of its token list.
     * @dev Use along with {balanceOf} to enumerate all of `owner`'s tokens.
     *      Reverts if `index` is greater than or equal to {balanceOf(owner)}.
     * @param owner The address to query.
     * @param index The index in the owner's token list.
     * @return The token ID at the given index for the owner.
     */
    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) external view returns (uint256);

    /**
     * @notice Returns a token ID at a given `index` of all the tokens stored by the contract.
     * @dev Use along with {totalSupply} to enumerate all tokens.
     *      Reverts if `index` is greater than or equal to {totalSupply()}.
     * @param index The index in the global token list.
     * @return The token ID at the given index of all tokens.
     */
    function tokenByIndex(uint256 index) external view returns (uint256);
}
