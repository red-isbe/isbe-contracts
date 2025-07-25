// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IDidDocumentDetailed {
    struct VMethod {
        bytes publicKey;
        bool isSecp256k1;
        bool revoked;
    }

    struct VRelationship {
        string name;
        string vMethodId;
        uint256 notBefore;
        uint256 notAfter;
        uint256 indexDid;
    }

    event DidDocumentInserted(
        string did,
        string baseDocument,
        string vMethodId,
        bytes publicKey,
        bool isSecp256k1,
        uint256 notBefore,
        uint256 notAfter
    );

    event BaseDocumentUpdated(string did, string baseDocument);

    function insertDidDocument(
        string memory did,
        string memory baseDocument,
        string memory vMethodId,
        bytes memory publicKey,
        bool isSecp256k1,
        uint256 notBefore,
        uint256 notAfter
    ) external returns (bool success);

    function updateBaseDocument(
        string memory did,
        string memory baseDocument
    ) external returns (bool success);

    function getDids(
        uint256 page,
        uint256 pageSize
    )
        external
        view
        returns (
            string[] memory items,
            uint256 total,
            uint256 howMany,
            uint256 prev,
            uint256 next
        );

    function getDidDocument(
        string memory did
    )
        external
        view
        returns (
            string memory baseDocument,
            string[] memory controllers,
            string[] memory vMethodIds,
            VMethod[] memory vMethods,
            VRelationship[] memory vRelationships
        );

    function getDidDocumentByTimestamp(
        string memory did,
        uint256 timestamp
    )
        external
        view
        returns (
            string memory baseDocument,
            string[] memory controllers,
            string[] memory vMethodIds,
            VMethod[] memory vMethods,
            VRelationship[] memory vRelationships
        );
}
