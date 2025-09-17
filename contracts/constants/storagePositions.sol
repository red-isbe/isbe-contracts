// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
// solhint-disable max-line-length

// keccak256('isbe.contracts.diamond.storage')
bytes32 constant _DIAMOND_STORAGE_POSITION = 0x14a872dcf5b21c7ac5c7a21241cb3088ada7d77b91d45cb734d07fb6e61a0e4e;

// keccak256('isbe.contracts.isbe.proxy.storage')
bytes32 constant _ISBE_PROXY_STORAGE_POSITION = 0x04fb5b1674918eac185959cfae932d99373bdf254d85286d6561bd7c87ae22e8;

// keccak256('isbe.contracts.erc20.storage');
bytes32 constant _ERC20_STORAGE_POSITION = 0xd93ac5c223af8b55b10aca6a04761f021176cb4baf866e7484f3c8d7325c3a93;

// keccak256('isbe.contracts.erc20.capped.storage');
bytes32 constant _ERC20_CAPPED_STORAGE_POSITION = 0x856c4e5ce77b898d0ed139a2efc3542d6f10ce029e0a2516ae963aa6a9348766;

// keccak256('isbe.contracts.access.control.storage');
bytes32 constant _ACCESS_CONTROL_STORAGE_POSITION = 0xb335729b1c9d0dd5cb00f5400f21de5f6cbacc7f26b7f1d63701569692e3b8ee;

// keccak256('isbe.contracts.initializable.storage');
bytes32 constant _INITIALIZABLE_STORAGE_POSITION = 0xcfff96098fae8df9a4c6ae59e43fc7aef2c8b100dc15a9fa0a7acdc7cfa7d956;

// keccak256('isbe.contracts.hash.timestamp.storage');
bytes32 constant _HASH_TIMESTAMP_STORAGE_POSITION = 0x9461e6f53daf5c3d0aa4d10025e40b84fad06da43fb4fab1a98f3e6b3a58d616;

// keccak256('isbe.contracts.asset.event.tracker.storage');
bytes32 constant _ASSET_EVENT_TRACKER_STORAGE_POSITION = 0xb13a0c12204f114e7a8e799996dabff59f106350c92089a46344d8deff3164b3;

// keccak256('isbe.contracts.pause.storage');
bytes32 constant _PAUSE_STORAGE_POSITION = 0x1d1f84ff22b88aba71617485b5278dbc9110b6bf91b86a247efd1071e92d099a;

// keccak256('isbe.contracts.ownable.storage');
bytes32 constant _OWNABLE_STORAGE_POSITION = 0xbc95c8238b97fd6fe32b005c5fe8a78a552af93ec42635c72ee8c46205c82db7;

// keccak256('isbe.contracts.ownable2step.storage');
bytes32 constant _OWNABLE2STEP_STORAGE_POSITION = 0xd98f695f92cbf5b2cd00d847e9c69c1e7b2a437c38bab1d15885003ee783a631;

// keccak256('isbe.contracts.reentrancyguard.storage');
bytes32 constant _REENTRANCY_GUARD_POSITION = 0x7bf241ea64ab5edc778605f2e8ec976d076766db0a3b325c3d4cf284b900691c;

// keccak256('isbe.contracts.business.logic.storage');
bytes32 constant _BUSINESS_LOGIC_STORAGE_POSITION = 0xcc909a7aa58395856caf7fad6a3a60f28409d3125d9bcd5a8af0f1af5335b5fe;

// keccak256('isbe.contracts.erc165.storage');
bytes32 constant _ERC165_STORAGE_POSITION = 0x5a9f265fc8293625a32b1b511d224627edb2b19485eec7afa363a8bc332ee1c9;

// keccak256('isbe.contracts.configuration.management.storage');
bytes32 constant _CONFIGURATION_MANAGEMENT_STORAGE_POSITION = 0x4beef12830ad37dac464f5aea92542e2dc4726542294394da538b824bc1f19f0;

// keccak256('isbe.contracts.proxy.factory.storage');
bytes32 constant _PROXY_FACTORY_STORAGE_POSITION = 0xaa8d33df53b16b2997ff500eedf8d4d1e966355596b60403562e732c9efb474a;

//ERC3643 storage position
// keccak256('isbe.contracts.erc3643.metadata.storage');
bytes32 constant _ERC3643_METADATA_STORAGE_POSITION = 0x84ed0b9176400cfe0bb1701ac1a14a9c7d7e2130c0db5a7adfbb9aa29de4d7f2;

// keccak256('isbe.contracts.erc3643.regulatory.storage');
bytes32 constant _ERC3643_REGULATORY_STORAGE_POSITION = 0x77f33cda3a8ae313a958d1eb7343a4200a6471530af5efefaf46be2cc2a6f99c;


//ERC721 storage position
// keccak256('isbe.contracts.erc721.storage');
bytes32 constant _ERC721_STORAGE_POSITION = 0x831e41d39c52997482833cb014c17663793796e3e15559f599f945b05d1d8c17;

// keccak256('isbe.contracts.erc721.capped.storage');
bytes32 constant _ERC721_CAPPED_STORAGE_POSITION = 0x68abe8f291911e473a79ad8b9632ea2f4e12bec61ec5fc0b39019d84eac1786a;

// keccak256('isbe.contracts.erc721.snapshot.storage');
bytes32 constant _ERC721_SNAPSHOT_STORAGE_POSITION = 0xb8b8eb4b7ec15c12c11fa90a47c5ca87b2bf70f08ce0b50ddc4308120d336886;

// keccaz('isbe.contracts.erc721.enumerable.storage');
bytes32 constant _ERC721_ENUMERABLE_STORAGE_POSITION = 0x3969fad27725f1ed90ce289e31008b0b28af16d6ab387c1b3253de404b8dc79d;

// keccak256('isbe.contracts.erc721.royalty.storage');
bytes32 constant _ERC721_ROYALTY_STORAGE_POSITION = 0xe78a59431484f3fef1053619e34c03dcd3180e5a68e7f74e0726c4b594d6f743;

// keccak256('isbe.contracts.erc721.consecutive.storage');
bytes32 constant _ERC721_CONSECUTIVE_STORAGE_POSITION = 0x862b4288cbdf8a7b1161ce9ee0c4bcad401e2b91e048ff96ad0a492a5b5eb7ef;

// keccak256('isbe.contracts.did.document.detailed.storage');
bytes32 constant _DID_DOCUMENT_DETAILED_STORAGE_POSITION = 0x80e94812a2790226ccf997ec25d285a8dcc6c5b510b98e9845f9905541840650;

// keccak256('isbe.contracts.did.controllers.storage');
bytes32 constant _DID_CONTROLLERS_STORAGE_POSITION = 0xf63f4b221a52b770150d672310294c82430977254746fa6de226a1610090ce5c;

// keccak256('isbe.contracts.did.vrelationships.storage');
bytes32 constant _DID_VRELATIONSHIPS_STORAGE_POSITION = 0x069080572c15b1fdb02941c6065fda2799e12c178afaf7e09aba823ce980a70f;

// solhint-enable max-line-length
