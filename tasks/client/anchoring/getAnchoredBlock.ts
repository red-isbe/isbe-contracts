import { task, types } from 'hardhat/config'
import { getAnchoredBlock } from '../../../scripts/client/anchoringCoreFacet'

/*
npx hardhat anchoringcorefacet:getanchoredblock \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --blocknumber 100 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getanchoredblock',
    'Prepare parameters for calling IAnchoringCore.getAnchoredBlock'
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
        'blocknumber',
        'Block number to query (_blockNumber, uint256)',
        undefined,
        types.string
    )
    .setAction(async ({ governancediamond, chainid, blocknumber }, hre) => {
        console.log('anchoringcorefacet:getanchoredblock')
        console.log('Target Governance Diamond:', governancediamond)
        console.log(
            'Function: getAnchoredBlock(uint256 _chainId, uint256 _blockNumber)'
        )
        console.log('Parameters:')
        console.log('  _chainId     :', chainid.toString())
        console.log('  _blockNumber :', blocknumber.toString())
        console.log(`Network: ${hre.network.name}`)

        const result = await getAnchoredBlock(
            hre,
            governancediamond,
            chainid,
            blocknumber
        )

        console.log('\n✅ getAnchoredBlock result:')
        console.log('  blockNumber:', result.blockNumber.toString())
        console.log('  blockHash  :', result.blockHash)
        console.log('  stateRoot  :', result.stateRoot)
        console.log('  timestamp  :', result.timestamp.toString())
        console.log('  anchorer   :', result.anchorer)
    })
