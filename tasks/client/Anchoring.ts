
import { getAnchoredBlock, getAnchoringStats, getBlocksInRange, getChainMetadata, getLastNBlocks, getLastAnchoredBlock, getRegisteredChains, isBlockAnchored, registerChain, anchorBlock, anchorBlocksBatch } from "../../scripts/client/anchoringCoreFacet";
import { SignatureProviderFactory } from "../deployment/providers/SignatureProviderFactory";
import { task, types } from "hardhat/config";



/* ============================================================
   Function list task
   ============================================================ */
task(
    "anchoringcorefacet:functionlist",
    "Prints all available AnchoringCoreFacet tasks"
).setAction(async () => {
    console.log("\n\x1b[1m📋 Available AnchoringCoreFacet tasks:\x1b[0m\n");
    
    const tasks = [
        {
            name: "anchoringcorefacet:getregisteredchains",
            description: "Get paginated list of registered chains",
            params: "--governancediamond <address> --pageindex <uint256> --pagelength <uint256>",
            example: "npx hardhat anchoringcorefacet:getregisteredchains --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --pageindex 0 --pagelength 10"
        },
        {
            name: "anchoringcorefacet:getchainmetadata",
            description: "Get this chain ID and all registered chain IDs",
            params: "--governancediamond <address>",
            example: "npx hardhat anchoringcorefacet:getchainmetadata --network <network> --governancediamond 0x00000000000000000000000000000000000015BE"
        },
        {
            name: "anchoringcorefacet:getanchoringstats",
            description: "Get anchoring statistics for a specific chain",
            params: "--governancediamond <address> --chainid <uint256>",
            example: "npx hardhat anchoringcorefacet:getanchoringstats --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1"
        },
        {
            name: "anchoringcorefacet:getblocksinrange",
            description: "Get anchored blocks in a range",
            params: "--governancediamond <address> --chainid <uint256> --fromblock <uint256> --toblock <uint256>",
            example: "npx hardhat anchoringcorefacet:getblocksinrange --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1 --fromblock 100 --toblock 110"
        },
        {
            name: "anchoringcorefacet:getlastnblocks",
            description: "Get the last N anchored blocks",
            params: "--governancediamond <address> --chainid <uint256> --count <uint256>",
            example: "npx hardhat anchoringcorefacet:getlastnblocks --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1 --count 5"
        },
        {
            name: "anchoringcorefacet:isblockanchored",
            description: "Check if a specific block is anchored",
            params: "--governancediamond <address> --chainid <uint256> --blocknumber <uint256>",
            example: "npx hardhat anchoringcorefacet:isblockanchored --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1 --blocknumber 100"
        },
        {
            name: "anchoringcorefacet:getanchoredblock",
            description: "Get details of a specific anchored block",
            params: "--governancediamond <address> --chainid <uint256> --blocknumber <uint256>",
            example: "npx hardhat anchoringcorefacet:getanchoredblock --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1 --blocknumber 100"
        },
        {
            name: "anchoringcorefacet:getlastanchoredblock",
            description: "Get the last anchored block for a chain",
            params: "--governancediamond <address> --chainid <uint256>",
            example: "npx hardhat anchoringcorefacet:getlastanchoredblock --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1"
        },
        {
            name: "anchoringcorefacet:registerchain",
            description: "Register a new chain for anchoring (requires ANCHORER_ROLE)",
            params: "--governancediamond <address> --chainid <uint256>",
            example: "npx hardhat anchoringcorefacet:registerchain --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1"
        },
        {
            name: "anchoringcorefacet:anchorblock",
            description: "Anchor a single block (requires ANCHORER_ROLE)",
            params: "--governancediamond <address> --chainid <uint256> --blocknumber <uint256> --blockhash <bytes32> --stateroot <bytes32>",
            example: "npx hardhat anchoringcorefacet:anchorblock --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1 --blocknumber 100 --blockhash 0xaaaa... --stateroot 0x1111..."
        },
        {
            name: "anchoringcorefacet:anchorblocksbatch",
            description: "Anchor multiple blocks in batch (requires ANCHORER_ROLE)",
            params: "--governancediamond <address> --chainid <uint256> --blocknumbers <csv> --blockhashes <csv> --stateroots <csv>",
            example: "npx hardhat anchoringcorefacet:anchorblocksbatch --network <network> --governancediamond 0x00000000000000000000000000000000000015BE --chainid 1 --blocknumbers \"100,101,102\" --blockhashes \"0xaaaa...,0xbbbb...,0xcccc...\" --stateroots \"0x1111...,0x2222...,0x3333...\""
        }
    ];

    tasks.forEach((task, index) => {
        console.log(`\x1b[36m${index + 1}. ${task.name}\x1b[0m`);
        console.log(`   \x1b[90m${task.description}\x1b[0m`);
        console.log(`   \x1b[33mParams:\x1b[0m ${task.params}`);
        console.log(`   \x1b[32mExample:\x1b[0m ${task.example}`);
        console.log();
    });
});


task(
    "anchoringcorefacet:getregisteredchains",
    "Prepare parameters for calling IAnchoringCore.getRegisteredChains"
)
    // Address of the Governance Diamond where AnchoringCoreFacet is located
    .addParam(
        "governancediamond",
        "Address of the Governance Diamond",
        undefined,
        types.string
    )
    // _pageIndex (uint256)
    .addParam(
        "pageindex",
        "Page index (_pageIndex, uint256)",
        undefined,
        types.string
    )
    // _pageLength (uint256)
    .addParam(
        "pagelength",
        "Page length (_pageLength, uint256)",
        undefined,
        types.string
    )
    .setAction(async (taskArgs, hre) => {
        const { governancediamond, pageindex, pagelength } = taskArgs;



        console.log("anchoringcorefacet:getregisteredchains");
        console.log("Target Governance Diamond:", governancediamond);
        console.log("Function: getRegisteredChains(uint256 _pageIndex, uint256 _pageLength)");
        console.log("Governanxce Diamond:", governancediamond);
        console.log("Parameters:");
        console.log("  _pageIndex :", pageindex.toString());
        console.log("  _pageLength:", pagelength.toString());
        console.log(`Network: ${hre.network.name}`)

        const result = await getRegisteredChains(hre, governancediamond, pageindex, pagelength);

        console.log("\n✅ getRegisteredChains result:");
        console.log("  _thisChainId      :", result._thisChainId.toString());
        console.log("  _registeredChainIds:", result._registeredChainIds.map((id) => id.toString()).join(", "));
    });



task(
  "anchoringcorefacet:getchainmetadata",
  "Prepare parameters for calling IAnchoringCore.getChainMetadata"
)
  // Address of the Governance Diamond where AnchoringCoreFacet is located
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hre) => {
    const { governancediamond } = taskArgs;

    console.log("anchoringcorefacet:getchainmetadata");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: getChainMetadata()");

    console.log(`Network: ${hre.network.name}`)

    const result = await getChainMetadata(hre, governancediamond);

        console.log("\n✅ getChainMetadata result:");
        console.log("  _thisChainId      :", result._thisChainId.toString());
        console.log("  _registeredChainIds:", result._registeredChainIds.map((id) => id.toString()).join(", "));
  });


  task(
  "anchoringcorefacet:getanchoringstats",
  "Prepare parameters for calling IAnchoringCore.getAnchoringStats"
)
  // Address of the Governance Diamond
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to query (_chainId, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid },hre) => {
    console.log("anchoringcorefacet:getanchoringstats");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: getAnchoringStats(uint256 _chainId)");
    console.log("Parameters:");
    console.log("  _chainId:", chainid.toString());

    console.log(`Network: ${hre.network.name}`)

    const result = await getAnchoringStats(hre, governancediamond, chainid);

    //resuts
    console.log("\n✅ getAnchoringStats result for " + chainid.toString() + ":");
    console.log("  _totalAnchors     :", result._totalAnchors.toString());
    console.log("  _lastAnchoredBlock:", result._lastAnchoredBlock.toString());
    console.log("  _thisChainId      :", result._thisChainId.toString());
    console.log("  _anchoredChainId  :", result._anchoredChainId.toString());

  });

  task(
  "anchoringcorefacet:getblocksinrange",
  "Prepare parameters for calling IAnchoringCore.getBlocksInRange"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to query (_chainId, uint256)",
    undefined,
    types.string
  )
  // _fromBlock (uint256)
  .addParam(
    "fromblock",
    "Starting block number (_fromBlock, uint256)",
    undefined,
    types.string
  )
  // _toBlock (uint256)
  .addParam(
    "toblock",
    "Ending block number (_toBlock, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid, fromblock, toblock }, hre) => {
    console.log("anchoringcorefacet:getblocksinrange");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: getBlocksInRange(uint256 _chainId, uint256 _fromBlock, uint256 _toBlock)");
    console.log("Parameters:");
    console.log("  _chainId   :", chainid.toString());
    console.log("  _fromBlock :", fromblock.toString());
    console.log("  _toBlock   :", toblock.toString());

    console.log(`Network: ${hre.network.name}`)

    // Call getBlocksInRange function
    const result = await getBlocksInRange(hre, governancediamond, chainid, fromblock, toblock);

    // Display results
    console.log("\n✅ getBlocksInRange result:");
    console.log(`  Total blocks: ${result.length}`);
    
    result.forEach((block, index) => {
        console.log(`\n  Block #${index}:`);
        console.log(`    blockNumber: ${block.blockNumber.toString()}`);
        console.log(`    blockHash  : ${block.blockHash}`);
        console.log(`    stateRoot  : ${block.stateRoot}`);
        console.log(`    timestamp  : ${block.timestamp.toString()}`);
        console.log(`    anchorer   : ${block.anchorer}`);
    });


  });



task(
  "anchoringcorefacet:getlastnblocks",
  "Prepare parameters for calling IAnchoringCore.getLastNBlocks"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to query (_chainId, uint256)",
    undefined,
    types.string
  )
  // _count (uint256)
  .addParam(
    "count",
    "Number of blocks to retrieve (_count, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid, count }, hre) => {
    console.log("anchoringcorefacet:getlastnblocks");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: getLastNBlocks(uint256 _chainId, uint256 _count)");
    console.log("Parameters:");
    console.log("  _chainId:", chainid.toString());
    console.log("  _count  :", count.toString());

    console.log(`Network: ${hre.network.name}`)

    // Call getLastNBlocks function
    const result = await getLastNBlocks(hre, governancediamond, chainid, count);

    // Display results
    console.log("\n✅ getLastNBlocks result:");
    console.log(`  Total blocks: ${result.length}`);
    
    result.forEach((block, index) => {
        console.log(`\n  Block #${index}:`);
        console.log(`    blockNumber: ${block.blockNumber.toString()}`);
        console.log(`    blockHash  : ${block.blockHash}`);
        console.log(`    stateRoot  : ${block.stateRoot}`);
        console.log(`    timestamp  : ${block.timestamp.toString()}`);
        console.log(`    anchorer   : ${block.anchorer}`);
    });
  });


  task(
  "anchoringcorefacet:isblockanchored",
  "Prepare parameters for calling IAnchoringCore.isBlockAnchored"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to query (_chainId, uint256)",
    undefined,
    types.string
  )
  // _blockNumber (uint256)
  .addParam(
    "blocknumber",
    "Block number to query (_blockNumber, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid, blocknumber }, hre) => {
    console.log("anchoringcorefacet:isblockanchored");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: isBlockAnchored(uint256 _chainId, uint256 _blockNumber)");
    console.log("Parameters:");
    console.log("  _chainId     :", chainid.toString());
    console.log("  _blockNumber :", blocknumber.toString());

    console.log(`Network: ${hre.network.name}`)

    const result = await isBlockAnchored(hre, governancediamond, chainid, blocknumber);
    // Display result
    console.log("\n✅ isBlockAnchored result:");
    console.log(`  Is anchored: ${result}`);
  });



  task(
  "anchoringcorefacet:getanchoredblock",
  "Prepare parameters for calling IAnchoringCore.getAnchoredBlock"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to query (_chainId, uint256)",
    undefined,
    types.string
  )
  // _blockNumber (uint256)
  .addParam(
    "blocknumber",
    "Block number to query (_blockNumber, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid, blocknumber },hre) => {
    console.log("anchoringcorefacet:getanchoredblock");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: getAnchoredBlock(uint256 _chainId, uint256 _blockNumber)");
    console.log("Parameters:");
    console.log("  _chainId     :", chainid.toString());
    console.log("  _blockNumber :", blocknumber.toString());

    console.log(`Network: ${hre.network.name}`)

    const result = await getAnchoredBlock(hre, governancediamond, chainid, blocknumber);

    // Display result
    console.log("\n✅ getAnchoredBlock result:");
    console.log("  blockNumber:", result.blockNumber.toString());
    console.log("  blockHash  :", result.blockHash);
    console.log("  stateRoot  :", result.stateRoot);
    console.log("  timestamp  :", result.timestamp.toString());
    console.log("  anchorer   :", result.anchorer); 
  });


  task(
  "anchoringcorefacet:getlastanchoredblock",
  "Prepare parameters for calling IAnchoringCore.getLastAnchoredBlock"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to query (_chainId, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid },hre) => {
    console.log("anchoringcorefacet:getlastanchoredblock");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: getLastAnchoredBlock(uint256 _chainId)");
    console.log("Parameters:"); 
    console.log("  _chainId:", chainid.toString());

    console.log(`Network: ${hre.network.name}`)

    const result = await getLastAnchoredBlock(hre, governancediamond, chainid);

    // Display result
    console.log("\n✅ getLastAnchoredBlock result:");
    console.log("  blockNumber:", result.blockNumber.toString());
    console.log("  blockHash  :", result.blockHash);
    console.log("  stateRoot  :", result.stateRoot);
    console.log("  timestamp  :", result.timestamp.toString());
    console.log("  anchorer   :", result.anchorer);
  });


  task(
  "anchoringcorefacet:registerchain",
  "Prepare parameters for calling IAnchoringCore.registerChain"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID to register (_chainId, uint256)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid }) => {
    console.log("anchoringcorefacet:registerchain");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: registerChain(uint256 _chainId)");
    console.log("Parameters:");
    console.log("  _chainId:", chainid.toString());

    const signatureProvider = SignatureProviderFactory.create(hre)
    console.log(`Network: ${hre.network.name}`)
    console.log(`Curve: ${signatureProvider.getCurveType()}`)   

    const result = await registerChain(hre, governancediamond, chainid, signatureProvider);

    // Display result
    console.log("\n✅ registerChain transaction confirmed:");
    console.log("Done.");
  });


task(
  "anchoringcorefacet:anchorblock",
  "Prepare parameters for calling IAnchoringCore.anchorBlock"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID (_chainId, uint256)",
    undefined,
    types.string
  )
  // _blockNumber (uint256)
  .addParam(
    "blocknumber",
    "Block number (_blockNumber, uint256)",
    undefined,
    types.string
  )
  // _blockHash (bytes32)
  .addParam(
    "blockhash",
    "Block hash (_blockHash, bytes32)",
    undefined,
    types.string
  )
  // _stateRoot (bytes32)
  .addParam(
    "stateroot",
    "State root (_stateRoot, bytes32)",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid, blocknumber, blockhash, stateroot },hre) => {
    console.log("anchoringcorefacet:anchorblock");
    console.log("Target Governance Diamond:", governancediamond);
    console.log("Function: anchorBlock(uint256 _chainId, uint256 _blockNumber, bytes32 _blockHash, bytes32 _stateRoot)");
    console.log("Parameters:");
    console.log("  _chainId     :", chainid.toString());
    console.log("  _blockNumber :", blocknumber.toString());
    console.log("  _blockHash   :", blockhash);
    console.log("  _stateRoot   :", stateroot);
    const signatureProvider = SignatureProviderFactory.create(hre)
    console.log(`Network: ${hre.network.name}`)
    console.log(`Curve: ${signatureProvider.getCurveType()}`)

    const result = await anchorBlock(hre, governancediamond, chainid, blocknumber, blockhash, stateroot, signatureProvider);

    // Display result
    console.log("\n✅ anchorBlock transaction confirmed:");
    console.log("Done.");   
  });


task(
  "anchoringcorefacet:anchorblocksbatch",
  "Prepare parameters for calling IAnchoringCore.anchorBlocksBatch"
)
  // Governance Diamond address
  .addParam(
    "governancediamond",
    "Address of the Governance Diamond",
    undefined,
    types.string
  )
  // _chainId (uint256)
  .addParam(
    "chainid",
    "Chain ID (_chainId, uint256)",
    undefined,
    types.string
  )
  // _blockNumbers (uint256[])
  .addParam(
    "blocknumbers",
    "Comma-separated list of block numbers (_blockNumbers, uint256[])",
    undefined,
    types.string
  )
  // _blockHashes (bytes32[])
  .addParam(
    "blockhashes",
    "Comma-separated list of block hashes (_blockHashes, bytes32[])",
    undefined,
    types.string
  )
  // _stateRoots (bytes32[])
  .addParam(
    "stateroots",
    "Comma-separated list of state roots (_stateRoots, bytes32[])",
    undefined,
    types.string
  )
  .setAction(async ({ governancediamond, chainid, blocknumbers, blockhashes, stateroots },hre) => {
    // Convert CSV strings to arrays
    const blockNumbersArr = blocknumbers.split(",").map((x) => x.trim());
    const blockHashesArr = blockhashes.split(",").map((x) => x.trim());
    const stateRootsArr = stateroots.split(",").map((x) => x.trim());

    console.log("anchoringcorefacet:anchorblocksbatch");
    console.log("Target Governance Diamond:", governancediamond);
    console.log(
      "Function: anchorBlocksBatch(uint256 _chainId, uint256[] _blockNumbers, bytes32[] _blockHashes, bytes32[] _stateRoots)"
    );

    console.log("Parameters:");
    console.log("  _chainId      :", chainid.toString());
    console.log("  _blockNumbers :", blockNumbersArr);
    console.log("  _blockHashes  :", blockHashesArr);
    console.log("  _stateRoots   :", stateRootsArr);

    const signatureProvider = SignatureProviderFactory.create(hre)
    console.log(`Network: ${hre.network.name}`)
    console.log(`Curve: ${signatureProvider.getCurveType()}`)
    const result = await anchorBlocksBatch(hre, governancediamond, chainid, blockNumbersArr, blockHashesArr, stateRootsArr, signatureProvider);

    // Display result
    console.log("\n✅ anchorBlocksBatch transaction confirmed:");
    console.log("Done.");
  });
