import { task, types } from 'hardhat/config'
import { getLastNBlocks } from '../../../scripts/client/anchoringCoreFacet'

/*
npx hardhat anchoringcorefacet:getlastnblocks \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --count 5 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getlastnblocks',
    'Prepare parameters for calling IAnchoringCore.getLastNBlocks'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID to query (_chainId, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'count',
        'Number of blocks to retrieve (_count, uint256)',
        undefined,
        types.string
    )
    .setAction(async ({ governancediamond, chainid, count }, hre) => {
        console.log('anchoringcorefacet:getlastnblocks')
        console.log('Target Governance Diamond:', governancediamond)
        console.log(
            'Function: getLastNBlocks(uint256 _chainId, uint256 _count)'
        )
        console.log('Parameters:')
        console.log('  _chainId:', chainid.toString())
        console.log('  _count  :', count.toString())
        console.log(`Network: ${hre.network.name}`)

        const result = await getLastNBlocks(
            hre,
            governancediamond,
            chainid,
            count
        )

        console.log('\n✅ getLastNBlocks result:')
        console.log(`  Total blocks: ${result.length}`)

        result.forEach((block, index) => {
            console.log(`\n  Block #${index}:`)
            console.log(`    blockNumber: ${block.blockNumber.toString()}`)
            console.log(`    blockHash  : ${block.blockHash}`)
            console.log(`    stateRoot  : ${block.stateRoot}`)
            console.log(`    timestamp  : ${block.timestamp.toString()}`)
            console.log(`    anchorer   : ${block.anchorer}`)
        })
    })
