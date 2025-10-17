// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

// solhint-disable max-line-length

bytes32 constant _DEFAULT_ADMIN_ROLE = 0x00;

// keccak256('isbe.contracts.role.pauser');
bytes32 constant _PAUSER_ROLE = 0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1;

// keccak256('isbe.contracts.role.business.logic.deployer');
bytes32 constant _BUSINESS_LOGIC_DEPLOYER_ROLE = 0xdc99c621188983b30fd7ff7b62ee13c081548c6b000e3c54b59686f091418069;

// keccak256('isbe.contracts.role.governance.manager');
bytes32 constant _GOVERNANCE_MANAGER_ROLE = 0x44c016b7c7762ceb1f7aab96b102f733139c944c581ee882670e2636bebbc4c5;

// keccak256('isbe.contracts.role.governance.configuration.manager');
bytes32 constant _GOVERNANCE_CONFIGURATION_MANAGER_ROLE = 0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb;

// keccak256('isbe.contracts.role.configuration.manager');
bytes32 constant _CONFIGURATION_MANAGER_ROLE = 0xdc4b85a1ab8a3dbc4b47e1626cb620f2a5a5e4753d049a2d71f76e2cf26b1e0b;

// keccak256('isbe.contracts.role.isbe.pauser');
bytes32 constant _ISBE_PAUSER_ROLE = 0x643e67198985fdbcfc2807234f580aa2cab96bb7efe1ab3158da79255d493114;

// keccak256('isbe.contracts.role.isbe');
bytes32 constant _ISBE_ROLE = 0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239;

// keccak256('isbe.contracts.role.proxy.deployer');
bytes32 constant _PROXY_DEPLOYER_ROLE = 0xc6832bf28cac8042fe5597e3b605a7fa9af230954df24409efd82699171f3c26;

// keccak256('isbe.contracts.role.asset.event.tracker');
bytes32 constant _ASSET_EVENT_TRACKER_ROLE = 0x46ffae7721ce7c213dfc98101d48d6a7f58e3c12f2945ae1fb4f2e2862a44ff1;

// keccak256('isbe.contracts.role.hash.timestamp');
bytes32 constant _HASH_TIMESTAMP_ROLE = 0x3bb8341caefb6dc4800c130d6d6d2789f8c4e534bc168ff9a7eda2e2831a721f;

// keccak256('isbe.contracts.role.controller');
bytes32 constant _CONTROLLER_ROLE = 0x6bc432609a8af6e2d25fcffbe70872e0b3c63d88116a2b673c42dfbc130d9331;

// keccak256('isbe.contracts.role.cap');
bytes32 constant _CAP_ROLE = 0xd2231b344d69ba7f64c324f071f0ef91a388e60c2a6b529339afc42cf411cb61;

// keccak256('isbe.contracts.role.snapshot');
bytes32 constant _SNAPSHOT_ROLE = 0x0ca5e23bde0d5e6112f10b9752afc92df6901f9218a43771a113f0ee5ab6bd49;

// keccak256('isbe.contracts.role.minter');
bytes32 constant _MINTER_ROLE = 0xd8e8f9f9638a19d632dbb79025022db564483265e96ba99b2dd89df138e9cace;

// keccak256('isbe.contracts.role.royalty');
bytes32 constant _ROYALTY_ROLE = 0xe87ed15151829ed3753553fc34d39b49f60370ac439fddb4e9304af60bce3045;

// keccak256("isbe.contracts.role.freeze")
bytes32 constant _FREEZE_ROLE = 0xa4e18dbe5b5a07c8c736c28f272d9ef8b1c38dc1fc3a3e57f4a79d5ebd8dc8f4;

// keccak256("isbe.contracts.role.metadata")
bytes32 constant _METADATA_ROLE = 0x37c3b5a6b2e6b682d82cfaf5a8dc82ff6b64b930f276ee684d6368f079b14b8f;

// keccak256("isbe.contracts.role.regulatory")
bytes32 constant _REGULATORY_ROLE = 0x14eb35b88f6ef5e40610e3f30b90e8c0c32d045865e637f6c5bdb10d60afbf11;

// keccak256("isbe.contracts.role.recovery")
bytes32 constant _RECOVERY_ROLE = 0xf2297f89cf57d1a505c0563f0b3b7b36b043d2de6e2d0e5e75ee83cf3278e30f;


// solhint-enable max-line-length