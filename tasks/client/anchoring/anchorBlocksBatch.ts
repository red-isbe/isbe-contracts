import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { anchorBlocksBatch } from '../../../scripts/client/anchoring/anchorBlocksBatch'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:anchorblocksbatch \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --blocknumbers "100,101,102" \
  --blockhashes "0xaaaa...,0xbbbb...,0xcccc..." \
  --stateroots "0x1111...,0x2222...,0x3333..." \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:anchorblocksbatch',
    'Prepare parameters for calling IAnchoringCore.anchorBlocksBatch'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID (_chainId, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'blocknumbers',
        'Comma-separated list of block numbers (_blockNumbers, uint256[])',
        undefined,
        types.string
    )
    .addParam(
        'blockhashes',
        'Comma-separated list of block hashes (_blockHashes, bytes32[])',
        undefined,
        types.string
    )
    .addParam(
        'stateroots',
        'Comma-separated list of state roots (_stateRoots, bytes32[])',
        undefined,
        types.string
    )
    .setAction(
        async (
            {
                governancediamond,
                chainid,
                blocknumbers,
                blockhashes,
                stateroots,
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            const blockNumbersArr = blocknumbers.split(',').map((x) => x.trim())
            const blockHashesArr = blockhashes.split(',').map((x) => x.trim())
            const stateRootsArr = stateroots.split(',').map((x) => x.trim())

            console.log('anchoringcorefacet:anchorblocksbatch')
            console.log('Target Governance Diamond:', governancediamond)
            console.log(
                'Function: anchorBlocksBatch(uint256 _chainId, uint256[] _blockNumbers, bytes32[] _blockHashes, bytes32[] _stateRoots)'
            )
            console.log('Parameters:')
            console.log('  _chainId      :', chainid.toString())
            console.log('  _blockNumbers :', blockNumbersArr)
            console.log('  _blockHashes  :', blockHashesArr)
            console.log('  _stateRoots   :', stateRootsArr)

            const signatureProvider = SignatureProviderFactory.create(hre)
            console.log(`Network: ${hre.network.name}`)
            console.log(`Curve: ${signatureProvider.getCurveType()}`)

            await anchorBlocksBatch(
                hre,
                governancediamond,
                chainid,
                blockNumbersArr,
                blockHashesArr,
                stateRootsArr,
                signatureProvider
            )

            console.log('\n✅ anchorBlocksBatch transaction confirmed:')
            console.log('Done.')
        }
    )
