// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;
// solhint-disable max-line-length

// keccak256('isbe.contracts.diamond.storage')
bytes32 constant _DIAMOND_STORAGE_POSITION = 0x14a872dcf5b21c7ac5c7a21241cb3088ada7d77b91d45cb734d07fb6e61a0e4e;

// keccak256('isbe.contracts.isbe.proxy.storage')
bytes32 constant _ISBE_PROXY_STORAGE_POSITION = 0x04fb5b1674918eac185959cfae932d99373bdf254d85286d6561bd7c87ae22e8;

// keccak256('isbe.contracts.isbe.factory.storage')
bytes32 constant _ISBE_FACTORY_STORAGE_POSITION = 0xf18df51d58cf839810651e76968ddc504b87839e67b92222df77a61aa4446f7b;

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

//ERC20 storage position
// keccak256('isbe.contracts.erc20.storage');
bytes32 constant _ERC20_STORAGE_POSITION = 0xd93ac5c223af8b55b10aca6a04761f021176cb4baf866e7484f3c8d7325c3a93;

// keccak256('isbe.contracts.erc20.snapshot.storage');
bytes32 constant _ERC20_SNAPSHOT_STORAGE_POSITION = 0x3c2d5e4f4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b;

//ERC3643 IERC3643 storage position
// keccak256('isbe.contracts.erc3643.metadata.storage');
bytes32 constant _ERC3643_METADATA_STORAGE_POSITION = 0x84ed0b9176400cfe0bb1701ac1a14a9c7d7e2130c0db5a7adfbb9aa29de4d7f2;

// keccak256('isbe.contracts.erc3643.regulatory.storage');
bytes32 constant _ERC3643_REGULATORY_STORAGE_POSITION = 0x77f33cda3a8ae313a958d1eb7343a4200a6471530af5efefaf46be2cc2a6f99c;

// keccak256('isbe.contracts.erc3643.freeze.storage');
bytes32 constant _ERC3643_FREEZE_STORAGE_POSITION = 0x27f6de6c243b33bb392a1e63ddcbf96a71f9ff85e5053a0487b4a363c1ce1601;

// keccak256('isbe.contracts.erc3643.control.storage');
bytes32 constant _ERC3643_CONTROL_STORAGE_POSITION = 0x72d835f60ed84d9e97792d54a06b99959c3707d49cbd20abce0c598fa0e46898;

//ERC203643 storage position
// keccak256('isbe.contracts.erc203643.capped.storage');
bytes32 constant _ERC203643_CAPPED_STORAGE_POSITION = 0x1f4e8e2a5e3c4b6f8e2d3c4b5a6f7e8d9c0b1a2b3c4d5e6f7e8d9c0b1a2b3c4b;

//ERC3643 ICompliance storage position
// keccak256('isbe.contracts.erc3643.compliance.storage');
bytes32 constant _ERC3643_COMPLIANCE_STORAGE_POSITION = 0x0839ed7eb71d13e707e8b2ad0e7cb916fbc4ab86c8b8e577ec9429a0d2550a8f;

// keccak256('isbe.contracts.erc3643.compliance.maxbalance.storage');
bytes32 constant _ERC3643_COMPLIANCE_MAXBALANCE_STORAGE_POSITION = 0x6239b4c1aece1ee0151d1119cd69e25c484bcdbaae2b77a42d15f153a347f8ee;

// keccak256('isbe.contracts.erc3643.compliance.daymonthlimits.storage');
bytes32 constant _ERC3643_COMPLIANCE_DMLIM_STORAGE_POSITION = 0xea3ac2aee1c12b7d1264579e2e66d5726f130a61e7f86072d64993e7a6021a35;

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

// keccak256('isbe.contracts.issuer.storage');
bytes32 constant _ISSUER_STORAGE_POSITION = 0x68cda611a370aa0f838913dcacf77607f50aaf4928b5c181b28a027aee7c4500;

// keccak256('isbe.contracts.ens.registry.storage');
bytes32 constant _ENS_REGISTRY_STORAGE_POSITION = 0x53b88d0c454d93bf0c49742517d0b10b89ae98101c3fe2be64ccce2e1e5565eb;

// keccak256('isbe.contracts.ens.resolver.storage');
bytes32 constant _ENS_RESOLVER_STORAGE_POSITION = 0x7eeeaab5d0be819b06a8a1fddd88d4ec954e275a771038fb9c79504b5436db40;

// keccak256('isbe.contracts.ens.name.resolver.storage');
bytes32 constant _ENS_NAME_RESOLVER_STORAGE_POSITION = 0x5eff8a500f88fba4046e3d61e7f676da1a7ca3587fd0ebc144bda1e423588f7e;

// keccak256('isbe.contracts.ens.text.resolver.storage');
bytes32 constant _ENS_TEXT_RESOLVER_STORAGE_POSITION = 0x1e672c9cd99f4330c7ff51d9660001df30edb65bd515bf0b2eda846ec4f4e7d0;

// keccak256('isbe.contracts.ens.pubkey.resolver.storage');
bytes32 constant _ENS_PUBKEY_RESOLVER_STORAGE_POSITION = 0x859e6d813267ce3ef180fdfaa2dc3a194ac15c80eefc44396e3776e8138cea88;

// keccak256('isbe.contracts.ens.public.resolver.storage');
bytes32 constant _ENS_PUBLIC_RESOLVER_STORAGE_POSITION = 0x967893912e0fbee483c21e14add1c0d9fbca3ca703ffe6488c9d498a23055aef;

// keccak256('isbe.contracts.client.filtering.storage');
bytes32 constant _CLIENT_FILTERING_STORAGE_POSITION = 0x2b5ee3d658648477f5de5bda80985048daa085b962feb1da017ffe621f5fb82e;

// keccak256('isbe.contracts.client.timestamping.registry.storage');
bytes32 constant _TIMESTAMPING_REGISTRY_STORAGE_POSITION = 0x7bea5e2e127c51f0457ca47f4b1697de117ab9d5dbb6d8653dd490ff43b32fb6;

// keccak256('isbe.contracts.network.directory.storage');
bytes32 constant _NETWORK_DIRECTORY_STORAGE_POSITION = 0x3a0420dd147d7cf5a565887fe2c7ea7e96d447cad78f400d62fac5802d1cec34;

// keccak256('isbe.contracts.accountabstraction.smartaccount.storage');
bytes32 constant _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_STORAGE_POSITION = 0x08b1a88f6d4f9bd4b5e54ea613cf4d25682438e7843cfb0b2ff4b7ea1200f210;

// keccak256('isbe.contracts.accountabstraction.entrypoint.storage');
bytes32 constant _ACCOUNT_ABSTRACTION_ENTRY_POINT_STORAGE_POSITION = 0x74a306e08663d2a3938fe831e6153e4965e3deeddcdd07bd3ef1d176dadbb9c0;

// keccak256('isbe.contracts.accountabstraction.stakemanager.storage');
bytes32 constant _ACCOUNT_ABSTRACTION_STAKE_MANAGER_STORAGE_POSITION = 0x23bc7f9e877f6c626e6c3b449264d0825a91de68705ddf68c0c481c9d0f46b6b;

// keccak256('isbe.contracts.accountabstraction.noncemanager.storage');
bytes32 constant _ACCOUNT_ABSTRACTION_NONCE_MANAGER_STORAGE_POSITION = 0x3e262832d6a4d790081b7364026fa846010143a6402ee7d0481555fa5a041bde;

// BesuNodeManager - Core layer (shared enodes)
// keccak256('com.isbe.besu.node.manager.core.storage')
bytes32 constant _BESU_NODE_MANAGER_CORE_STORAGE_POSITION = 0x11ac89760e0337d7c2f84ee9741ea0ddac3e0d00723ece28a875d7acffbb14d1;

// BesuNodeManager - Validator layer
// keccak256('com.isbe.besu.node.manager.validator.storage')
bytes32 constant _VALIDATOR_MANAGER_STORAGE_POSITION = 0xbd302c9d8d04a55834b237b500b0ad6cdeaeeb83a98ce85123c5d669ac0074b7;

// BesuNodeManager - BootNode layer
// keccak256('com.isbe.besu.node.manager.bootnode.storage')
bytes32 constant _BOOTNODE_MANAGER_STORAGE_POSITION = 0x1c4ee151048963a5447e26f76f477ee266e42e6687937d5eb9aabf216b81aea2;

// BesuNodeManager - ExecutionNode layer
// keccak256('com.isbe.besu.node.manager.executionnode.storage')
bytes32 constant _EXECUTION_NODE_MANAGER_STORAGE_POSITION = 0x4a29f4fc2ef7acd6d55f40906cc864109900b56cf3108f89b0f6a07015cee858;

// keccak256('isbe.contracts.anchoring.storage');
bytes32 constant _ANCHORING_STORAGE_POSITION = 0x5910b7bacf413fc0f7947b11aa2cd75d48d701f58d393ed250a9e4e0f39b5187;

// keccak256('isbe.contracts.whitelist.basic.storage');
bytes32 constant _BASIC_WHITELIST_STORAGE_POSITION = 0x8c3a8a9f4e7b5d6c9a2b1e0f3d4a5c6e7b8d9a0c1e2f3a4b5c6d7e8f9a0b1c2d;

// keccak256('isbe.contracts.nonces.storage');
bytes32 constant _NONCES_STORAGE_POSITION = 0xce3bf22e0316902ae04f14a7f91ba9c636dee89e8b60f0e964c87d3f88c1a0fd;

// keccak256('isbe.contracts.service.did.registry.storage');
bytes32 constant _SERVICE_DID_REGISTRY_STORAGE_POSITION = 0x7caa54a54901b11933448b340f01805232da273262db5e6eab8d62342d73a5c0;

// solhint-enable max-line-length
