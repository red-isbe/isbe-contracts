// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @dev Interfaz para contratos que desean recibir tokens ERC721 de forma segura.
 */
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}
