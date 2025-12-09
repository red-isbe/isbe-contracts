import { task, types } from 'hardhat/config'
import { getBlocksInRange } from '../../../scripts/client/anchoringCoreFacet'

/*
npx hardhat anchoringcorefacet:getblocksinrange \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --fromblock 100 \
  --toblock 110 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getblocksinrange',
    'Prepare parameters for calling IAnchoringCore.getBlocksInRange'
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
        'fromblock',
        'Starting block number (_fromBlock, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'toblock',
        'Ending block number (_toBlock, uint256)',
        undefined,
        types.string
    )
    .setAction(
        async ({ governancediamond, chainid, fromblock, toblock }, hre) => {
            console.log('anchoringcorefacet:getblocksinrange')
            console.log('Target Governance Diamond:', governancediamond)
            console.log(
                'Function: getBlocksInRange(uint256 _chainId, uint256 _fromBlock, uint256 _toBlock)'
            )
            console.log('Parameters:')
            console.log('  _chainId   :', chainid.toString())
            console.log('  _fromBlock :', fromblock.toString())
            console.log('  _toBlock   :', toblock.toString())
            console.log(`Network: ${hre.network.name}`)

            const result = await getBlocksInRange(
                hre,
                governancediamond,
                chainid,
                fromblock,
                toblock
            )

            console.log('\n✅ getBlocksInRange result:')
            console.log(`  Total blocks: ${result.length}`)

            result.forEach((block, index) => {
                console.log(`\n  Block #${index}:`)
                console.log(`    blockNumber: ${block.blockNumber.toString()}`)
                console.log(`    blockHash  : ${block.blockHash}`)
                console.log(`    stateRoot  : ${block.stateRoot}`)
                console.log(`    timestamp  : ${block.timestamp.toString()}`)
                console.log(`    anchorer   : ${block.anchorer}`)
            })
        }
    )
