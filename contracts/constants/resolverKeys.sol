// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// solhint-disable max-line-length

// keccak256('isbe.contracts.access.control.resolver.key');
bytes32 constant _ACCESS_CONTROL_RESOLVER_KEY = 0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c;

// keccak256('isbe.contracts.access.control.did.resolver.key');
bytes32 constant _ACCESS_CONTROL_DID_RESOLVER_KEY = 0x91be68699977a17d16f4f996441c2bbd87a413d1114ef61d6d70019fc7904f4a;

// keccak256('isbe.contracts.asset.event.tracker.resolver.key');
bytes32 constant _ASSET_EVENT_TRACKER_RESOLVER_KEY = 0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157;

// keccak256('isbe.contracts.hash.timestamp.resolver.key');
bytes32 constant _HASH_TIMESTAMP_RESOLVER_KEY = 0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a;

// keccak256('isbe.contracts.erc20.resolver.key');
bytes32 constant _ERC20_RESOLVER_KEY = 0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad;

// keccak256('isbe.contracts.erc20.burnable.resolver.key');
bytes32 constant _ERC20_BURNABLE_RESOLVER_KEY = 0x81c694c8d5a595cfca0b2b486a8e2aff0a72d8063c636a02c1ca1cc12e55d471;

// keccak256('isbe.contracts.erc20.capped.resolver.key');
bytes32 constant _ERC20_CAPPED_RESOLVER_KEY = 0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b;

// keccak256('isbe.contracts.erc20.snapshot.resolver.key');
bytes32 constant _ERC20_SNAPSHOT_RESOLVER_KEY = 0xc4968fe952eba32a52cb112176a56b4e86a0fbaff835dc8336fa0e804a0af398;

// keccak256('isbe.contracts.erc20.controller.resolver.key');
bytes32 constant _ERC20_CONTROLLER_RESOLVER_KEY = 0xed76d446b6029b8a177fda4fc38162d9dc0dc29ab636541fd6e75ae60fe17151;

// keccak256('isbe.contracts.pause.resolver.key');
bytes32 constant _PAUSE_RESOLVER_KEY = 0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3;

// keccak256('isbe.contracts.ownable.resolver.key');
bytes32 constant _OWNABLE_RESOLVER_KEY = 0x32d893fe746ed6e72cf641731066f84e26611cdd03031f873957cb1a29071a5f;

// keccak256('isbe.contracts.diamond.resolver.key');
bytes32 constant _DIAMOND_RESOLVER_KEY = 0xa48ef589a9e2ec85332f5cce03f3c0311fea4c7dd368ec555f810826f433337e;

// keccak256('isbe.contracts.diamond.cut.resolver.key');
bytes32 constant _DIAMOND_CUT_RESOLVER_KEY = 0xb1733495acec04f904af52509bd68775ca2e4aa31f6948d02cccd2af2adee890;

// keccak256('isbe.contracts.diamond.loupe.resolver.key');
bytes32 constant _DIAMOND_LOUPE_RESOLVER_KEY = 0xa081a7fa2e40735a4006bc6a225e18158879b54064ab1f60045661349931c41b;

// keccak256('isbe.contracts.isbe,proxy.resolver.key');
bytes32 constant _ISBE_PROXY_RESOLVER_KEY = 0x10439eb60928efcdb5c19aae420e0787ddd18f1245bf81925d0338db838c39b1;

// keccak256('isbe.contracts.isbe.cut.resolver.key');
bytes32 constant _ISBE_CUT_RESOLVER_KEY = 0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25;

// keccak256('isbe.contracts.isbe.loupe.resolver.key');
bytes32 constant _ISBE_LOUPE_RESOLVER_KEY = 0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2;

// keccak256('isbe.contracts.business.logic.factory.resolver.key');
bytes32 constant _BUSINESS_LOGIC_FACTORY_RESOLVER_KEY = 0xc6315ad82a957243645764f5542166d6ca27427e14eee4c56d66d963349845f4;

// keccak256('isbe.contracts.erc165.resolver.key');
bytes32 constant _ERC165_RESOLVER_KEY = 0x0d211187337a25b55ba62c44fbaaff686007a4ff3d149631d418963345936a29;

// keccak256('isbe.contracts.configuration.management.resolver.key');
bytes32 constant _CONFIGURATION_MANAGEMENT_RESOLVER_KEY = 0x5c7eb9eee8ef1c4aad127182f7de73ed25d3582b9b642ad6c67b50ea0ce43eaf;

// keccak256('isbe.contracts.proxy.factory.resolver.key');
bytes32 constant _PROXY_FACTORY_RESOLVER_KEY = 0x949f2c59318fff1925835e4fd22837f508de87f71875ac3e71a5f5c7e4c74d10;

// keccak256('isbe.contracts.global.isbe.pausable.resolver.key');
bytes32 constant _GLOBAL_ISBE_PAUSABLE_RESOLVER_KEY = 0x95abb588e90c3cf7e85016cd7eef6fcbf9073b2a59c113a2f59ef664c86cf3f3;

//ERC721 ResolverKeys
// keccak256('isbe.contracts.erc721.burnable.resolver.key');
bytes32 constant _ERC721_BURNABLE_RESOLVER_KEY = 0x206b0e4238408e5768282093d791f76fa433862449b7d2f6bcfcf6334c68b731;

// keccak256('isbe.contracts.erc721.enumerable.resolver.key');
bytes32 constant _ERC721_ENUMERABLE_RESOLVER_KEY = 0xedb7f9fdb1d3f5f42d41b01b9be5a65625ceb3729df0767c42252b0ba9d8ccd5;

// keccak256('isbe.contracts.erc721.capped.resolver.key');
bytes32 constant _ERC721_CAPPED_RESOLVER_KEY = 0x562609faca97c2599c7b5267f4c9852db8d80261577ecea4c9660ff46f48ac8c;

// keccak256('isbe.contracts.erc721.controller.resolver.key');
bytes32 constant _ERC721_CONTROLLER_RESOLVER_KEY = 0x3151ba844095052447f78f5266df4cb3ce2c27fccb2dddb913b38ef0f5856367;

// keccak256('isbe.contracts.erc721.consecutive.resolver.key');
bytes32 constant _ERC721_CONSECUTIVE_RESOLVER_KEY = 0xcf4be1ff2685a826673d7398ca9747ab887769b9a9bbd181ec73d38a01329cd4;

// keccak256('isbe.contracts.erc721.snapshot.resolver.key');
bytes32 constant _ERC721_SNAPSHOT_RESOLVER_KEY = 0xf1a2b064b8a113b55cf2e7361db7c9361c635ec4d56c34424cf80a1d6478b51d;

// keccak256('isbe.contracts.erc721.royalty.resolver.key');
bytes32 constant _ERC721_ROYALTY_RESOLVER_KEY = 0x93a54f9adbfdce1437a27b11fa135ad0c5624ec6bf9a2b133b77864668ddab76;

// keccak256('isbe.contracts.erc721.resolver.key');
bytes32 constant _ERC721_RESOLVER_KEY = 0x90e014dbbf0f1e8a714d05a5a0c9464d9ab25275f7dcdaf3297d1ccc80452413;

// keccak256('isbe.contracts.erc721.test.wrapper.resolver.key');
bytes32 constant _ERC721_TEST_WRAPPER_RESOLVER_KEY = 0x88ce2f3be96e8567d435c96c8a2a63c4d4e94facd693f5591439278fb837d868;

// keccak256('isbe.contracts.did.document.detailed.resolver.key');
bytes32 constant _DID_DOCUMENT_DETAILED_RESOLVER_KEY = 0x5a02d9131742d56d318dab3c9e499ea3b8e4388b578aac9d31b55350b1076873;

// keccak256('isbe.contracts.did.controller.resolver.key');
bytes32 constant _DID_CONTROLLER_RESOLVER_KEY = 0x26339b1ee881bb2790df0ed18d4f8f5f6b66c9855aac4f506052b0cf2f51188c;

// keccak256('isbe.contracts.did.verification.method.resolver.key');
bytes32 constant _DID_VERIFICATION_METHOD_RESOLVER_KEY = 0xac8773db319c7049be61ab52c59325712b4ba639daa556105c3b1e20671238dd;

// keccak256('isbe.contracts.did.verification.relationship.resolver.key');
bytes32 constant _DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY = 0x32bd32541f3651dc69848ddc9cad21896eabb6a11034c19b03683da6e19b76d7;

// keccak256('isbe.contracts.did.client.filtering.resolver.key');
bytes32 constant _CLIENT_FILTERING_RESOLVER_KEY = 0x9d459b48dcede9ec86807b1af972b62ab0b2b0237e2187da45c02c25f3aeb016;

// keccak256('isbe.contracts.did.registry.query.resolver.key');
bytes32 constant _DID_REGISTRY_QUERY_RESOLVER_KEY = 0x5fb7bbf7185d00a34fa9c782b90e076f7b5d9e337febead788d0b980b59aa53b;

// keccak256('isbe.contracts.ens.registry.resolver.key');
bytes32 constant _ENS_REGISTRY_RESOLVER_KEY = 0xc0629a5fdc41a377e7fd772f766ce559d0fecbb52e72bd1b4915525935b59053;

// keccak256('isbe.contracts.ens.resolver.resolver.key');
bytes32 constant _ENS_RESOLVER_RESOLVER_KEY = 0x9daad5d269e40315c6ea27f7ccd5ec5e9cc50b975d6172504109b111170ce5d4;

// keccak256('isbe.contracts.ens.name.resolver.resolver.key');
bytes32 constant _ENS_NAME_RESOLVER_RESOLVER_KEY = 0xb220ec5bf774f9c3a891b2fc9f0b0bbfae8503f22056a0c835252f4a2feb5b4f;

// keccak256('isbe.contracts.ens.text.resolver.resolver.key');
bytes32 constant _ENS_TEXT_RESOLVER_RESOLVER_KEY = 0x153e8d37fcd8b283cb133570078b11503f8e93bb9437f0d6306f0e57443f9818;

// keccak256('isbe.contracts.ens.pubkey.resolver.resolver.key');
bytes32 constant _ENS_PUBKEY_RESOLVER_RESOLVER_KEY = 0x1c46b1cdbebdf5f3d15aae4a89c2a8fca0d9eff35f1f040b17caebc1726f8260;

// keccak256('isbe.contracts.ens.public.resolver.resolver.key');
bytes32 constant _ENS_PUBLIC_RESOLVER_RESOLVER_KEY = 0x01286e867987641a8805e8007327a88f6ebe0d80426ec755c0f86f57d5913c61;

// keccak256('isbe.contracts.timestamping.registry.resolver.key');
bytes32 constant _TIMESTAMPING_REGISTRY_RESOLVER_KEY = 0xc96c356b7532d6eba398b97f362b68829d7392627c879e8ba5909c4810ca7ad5;

// keccak256('BESU_NODE_MANAGER')
bytes32 constant _BESU_NODE_MANAGER_RESOLVER_KEY = 0xed251ea052ffafa4903db889a3309600adf2ac15456e02760c1221ea3792c1ca;

// keccak256('isbe.contracts.anchoring.core.resolver.key');
bytes32 constant _ANCHORING_CORE_RESOLVER_KEY = 0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d;

// keccak256('isbe.contracts.network.directory.resolver.key')
bytes32 constant _NETWORK_DIRECTORY_RESOLVER_KEY = 0xa02352a617fa557d3bef91c39fbe51f1ffb7d8f551ceafd425722840430d2969;

// solhint-enable max-line-length
